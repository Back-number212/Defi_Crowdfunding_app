"use client"

import { useState, useEffect, useRef } from "react"
import { useWeb3 } from "@/lib/web3"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Trash2,
  Smile,
  Heart,
  ThumbsUp,
  Loader2,
  MoreVertical,
  Edit2
} from "lucide-react"
import { 
  createComment, 
  getComments, 
  deleteComment,
  updateComment,
  toggleReaction,
  getUserReaction,
  syncCampaignFromContract
} from "@/lib/supabase-services"
import type { Comment } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { useFormatting } from "@/hooks/use-formatting"

interface CampaignCommentsProps {
  campaignId: number
  creatorWallet: string
}

const REACTION_TYPES = [
  { type: 'like' as const, icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  { type: 'love' as const, icon: Heart, label: 'Love', color: 'text-red-500' },
  { type: 'laugh' as const, icon: Smile, label: 'Haha', color: 'text-yellow-500' },
  { type: 'wow' as const, icon: '😮', label: 'Wow', color: 'text-purple-500' },
  { type: 'sad' as const, icon: '😢', label: 'Sad', color: 'text-gray-500' },
  { type: 'angry' as const, icon: '😠', label: 'Angry', color: 'text-orange-500' },
]

export function CampaignComments({ campaignId, creatorWallet }: CampaignCommentsProps) {
  const { account, contract } = useWeb3()
  const { toast } = useToast()
  const { formatAddress } = useFormatting()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    content: "",
    image: null as File | null,
    imagePreview: "" as string | null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadComments()
    
    // Refresh comments every 30 seconds
    const interval = setInterval(loadComments, 30000)
    return () => clearInterval(interval)
  }, [campaignId, creatorWallet])

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await getComments(campaignId, creatorWallet)
      if (error) {
        // Log all possible error information
        const errorKeys = Object.keys(error || {})
        const errorString = String(error)
        const errorJSON = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        
        console.error("Failed to load comments - Error object:", error)
        console.error("Error type:", typeof error)
        console.error("Error keys:", errorKeys)
        console.error("Error string:", errorString)
        console.error("Error JSON:", errorJSON)
        console.error("Error details:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          name: error?.name,
          stack: error?.stack,
          toString: error?.toString?.(),
          valueOf: error?.valueOf?.(),
          fullError: errorJSON
        })
        
        // Even if error exists, try to show empty comments instead of crashing
        setComments([])
      } else {
        setComments(data || [])
      }
    } catch (error: any) {
      console.error("Failed to load comments - Exception:", error)
      console.error("Exception details:", {
        message: error?.message,
        stack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      })
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null, imagePreview: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // TODO: Implement proper image upload to Supabase Storage
    // For now, return base64 data URL (not recommended for production)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet to comment.",
        variant: "destructive"
      })
      return
    }

    if (!formData.content.trim() && !formData.image) {
      toast({
        title: "Error",
        description: "Please enter content or select an image.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      let imageUrl: string | undefined
      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }
      
      let error
      if (editingId) {
        // Update existing comment
        const result = await updateComment(
          editingId,
          account,
          formData.content.trim() || undefined,
          imageUrl
        )
        error = result.error
      } else {
        // Sync campaign from contract first to ensure we have complete data
        if (contract) {
          await syncCampaignFromContract(campaignId, contract)
        }
        
        // Create new comment
        const result = await createComment(
          campaignId,
          account,
          formData.content.trim() || undefined,
          imageUrl,
          undefined,
          creatorWallet,
          contract
        )
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Success!",
        description: editingId ? "Comment has been updated." : "Comment has been posted.",
        variant: "default"
      })

      // Reset form
      setFormData({ content: "", image: null, imagePreview: null })
      setEditingId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Reload comments
      loadComments()
    } catch (error: any) {
      console.error("Failed to create comment:", error)
      toast({
        title: "Error",
        description: error?.message || error?.details || JSON.stringify(error) || "Failed to post comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setFormData({
      content: comment.content || "",
      image: null,
      imagePreview: comment.image_url || null
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ content: "", image: null, imagePreview: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      setDeletingId(commentId)
      const { error } = await deleteComment(commentId, account!)
      if (error) throw error

      toast({
        title: "Success!",
        description: "Comment has been deleted.",
        variant: "default"
      })

      loadComments()
    } catch (error: any) {
      console.error("Failed to delete comment:", error)
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      })
      toast({
        title: "Error",
        description: error?.message || error?.details || "Failed to delete comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleReaction = async (commentId: string, reactionType: typeof REACTION_TYPES[number]['type']) => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet to react.",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await toggleReaction(commentId, account, reactionType)
      if (error) throw error

      // Reload comments to get updated reactions
      loadComments()
    } catch (error: any) {
      console.error("Failed to toggle reaction:", error)
      toast({
        title: "Lỗi",
        description: "Failed to react. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getUserReactionForComment = async (commentId: string) => {
    if (!account) return null
    const { data } = await getUserReaction(commentId, account)
    return data?.reaction_type || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Community Comments</h3>

      {/* Comment Form */}
      {account && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingId && (
                <div className="mb-2">
                  <Badge variant="outline">Editing comment</Badge>
                </div>
              )}
              <div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={editingId ? "Edit your comment..." : "Write a comment..."}
                  rows={3}
                />
              </div>

              {formData.imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="max-w-xs max-h-48 rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="comment-image"
                />
                <Label htmlFor="comment-image" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </span>
                  </Button>
                </Label>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={submitting} className="ml-auto">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {editingId ? "Update" : "Post"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = account?.toLowerCase() === comment.author_wallet.toLowerCase()
            const isCreator = comment.is_creator || false
            const userReaction = comment.reactions?.find(r => r.user_wallet.toLowerCase() === account?.toLowerCase())

            return (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={`https://effigy.im/a/${comment.author_wallet}.svg`} />
                      <AvatarFallback>
                        {comment.author_wallet.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${isCreator ? 'text-primary font-semibold' : ''}`}>
                          {formatAddress(comment.author_wallet)}
                        </span>
                        {isCreator && (
                          <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                            Creator
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(comment)}
                                disabled={editingId === comment.id || deletingId === comment.id}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(comment.id)}
                                className="text-destructive"
                                disabled={deletingId === comment.id || editingId === comment.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deletingId === comment.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {comment.content && (
                        <p className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
                      )}

                      {comment.image_url && (
                        <div className="mb-2">
                          <img
                            src={comment.image_url}
                            alt="Comment image"
                            className="max-w-md max-h-64 rounded-md"
                          />
                        </div>
                      )}

                      {/* Reactions */}
                      <div className="flex items-center gap-2 mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8">
                              {userReaction ? (
                                (() => {
                                  const reaction = REACTION_TYPES.find(r => r.type === userReaction.reaction_type)
                                  if (!reaction) return <Smile className="h-4 w-4" />
                                  if (typeof reaction.icon === 'string') {
                                    return <span className="text-sm">{reaction.icon}</span>
                                  }
                                  const Icon = reaction.icon
                                  return <Icon className={`h-4 w-4 ${reaction.color}`} />
                                })()
                              ) : (
                                <Smile className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {REACTION_TYPES.map((reaction) => {
                              const Icon = typeof reaction.icon === 'string' ? null : reaction.icon
                              const count = comment.reaction_counts?.[reaction.type] || 0
                              const isActive = userReaction?.reaction_type === reaction.type

                              return (
                                <DropdownMenuItem
                                  key={reaction.type}
                                  onClick={() => handleReaction(comment.id, reaction.type)}
                                  className={isActive ? 'bg-accent' : ''}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {Icon ? (
                                      <Icon className={`h-4 w-4 ${reaction.color}`} />
                                    ) : (
                                      <span className="text-lg">{reaction.icon}</span>
                                    )}
                                    <span>{reaction.label}</span>
                                    {count > 0 && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {count}
                                      </span>
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Show reaction counts */}
                        {comment.reaction_counts && Object.keys(comment.reaction_counts).length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {Object.entries(comment.reaction_counts).map(([type, count]) => {
                              const reaction = REACTION_TYPES.find(r => r.type === type)
                              if (!reaction || count === 0) return null
                              const Icon = typeof reaction.icon === 'string' ? null : reaction.icon
                              
                              return (
                                <span key={type} className="flex items-center gap-1">
                                  {Icon ? (
                                    <Icon className={`h-3 w-3 ${reaction.color}`} />
                                  ) : (
                                    <span className="text-xs">{reaction.icon}</span>
                                  )}
                                  <span>{count}</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

