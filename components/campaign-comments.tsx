"use client"

import { useState, useEffect, useRef } from "react"
import { useWeb3 } from "@/lib/web3"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Send, MoreVertical, Trash2, Edit2, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFormatting } from "@/hooks/use-formatting"
import { supabase } from "@/lib/supabase"
import type { Comment } from "@/lib/supabase"

interface CommentWithTimestamp extends Comment {
  timestamp: number
}

interface CampaignCommentsProps {
  campaignId: number
}

// Generate avatar URL from wallet address using a service like DiceBear
const generateAvatarUrl = (address: string) => {
  // Using DiceBear API with identicon style
  const seed = address.toLowerCase()
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

// Get initials from wallet address
const getInitials = (address: string) => {
  return address.slice(2, 4).toUpperCase()
}

// Format timestamp to relative time
const formatTimestamp = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

// Format full date
const formatFullDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function CampaignComments({ campaignId }: CampaignCommentsProps) {
  const { account, isConnected } = useWeb3()
  const { formatAddress } = useFormatting()
  const [comments, setComments] = useState<CommentWithTimestamp[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Load comments from Supabase on mount
  useEffect(() => {
    loadComments()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform Supabase comments to include timestamp
      const transformedComments: CommentWithTimestamp[] = (data || []).map(comment => ({
        ...comment,
        timestamp: new Date(comment.created_at).getTime()
      }))

      setComments(transformedComments)
    } catch (err) {
      console.error("Error loading comments:", err)
      setError("Failed to load comments. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (!isLoading) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newComment, editContent])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isConnected || !account) return

    setIsSubmitting(true)
    setError(null)
    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          campaign_id: campaignId,
          author: account,
          content: newComment.trim(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      setNewComment("")
      // Comments will be reloaded via real-time subscription
    } catch (err) {
      console.error("Error submitting comment:", err)
      setError("Failed to post comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!isConnected || !account) return
    
    const comment = comments.find(c => c.id === commentId)
    if (!comment || comment.author.toLowerCase() !== account.toLowerCase()) {
      return
    }

    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) throw deleteError
      // Comments will be reloaded via real-time subscription
    } catch (err) {
      console.error("Error deleting comment:", err)
      setError("Failed to delete comment. Please try again.")
    }
  }

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment && account && comment.author.toLowerCase() === account.toLowerCase()) {
      setEditingId(commentId)
      setEditContent(comment.content)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return

    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', editingId)

      if (updateError) throw updateError

      setEditingId(null)
      setEditContent("")
      // Comments will be reloaded via real-time subscription
    } catch (err) {
      console.error("Error updating comment:", err)
      setError("Failed to update comment. Please try again.")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isEdit: boolean = false) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (isEdit) {
        handleSaveEdit()
      } else {
        handleSubmitComment()
      }
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Comment Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      <Separator />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Comment Form */}
      {isConnected && account ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={generateAvatarUrl(account)} alt={formatAddress(account)} />
              <AvatarFallback>{getInitials(account)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                placeholder="Write a comment..."
                className="min-h-[100px] resize-none border-2 focus:border-primary transition-colors"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+Enter or Cmd+Enter to submit
                </p>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed rounded-lg text-center">
          <p className="text-muted-foreground">
            Please connect your wallet to leave a comment
          </p>
        </div>
      )}

      <Separator />

      {/* Comments List */}
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = account && comment.author.toLowerCase() === account.toLowerCase()
            const isEditing = editingId === comment.id

            return (
              <div
                key={comment.id}
                className="group comment-item space-y-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={generateAvatarUrl(comment.author)}
                      alt={formatAddress(comment.author)}
                    />
                    <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
                  </Avatar>

                  {/* Comment Content */}
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Author and Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm truncate">
                          {formatAddress(comment.author)}
                        </span>
                        {isAuthor && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs text-muted-foreground"
                          title={formatFullDate(comment.timestamp)}
                        >
                          {formatTimestamp(comment.timestamp)}
                          {comment.updated_at && comment.updated_at !== comment.created_at && (
                            <span className="ml-1 text-muted-foreground/70">(edited)</span>
                          )}
                        </span>
                        {isAuthor && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditComment(comment.id)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Comment Text */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, true)}
                          className="min-h-[80px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            disabled={!editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  )
}

