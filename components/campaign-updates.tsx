"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/lib/web3"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  X, 
  Image as ImageIcon, 
  Calendar,
  Trash2,
  Loader2,
  Edit2
} from "lucide-react"
import { createUpdate, getUpdates, deleteUpdate, updateUpdate, syncCampaignFromContract } from "@/lib/supabase-services"
import type { Update } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"

interface CampaignUpdatesProps {
  campaignId: number
  creatorWallet: string
  isCreator: boolean
}

export function CampaignUpdates({ campaignId, creatorWallet, isCreator }: CampaignUpdatesProps) {
  const { account, contract } = useWeb3()
  const { toast } = useToast()
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    images: [] as string[]
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])

  useEffect(() => {
    loadUpdates()
  }, [campaignId])

  const loadUpdates = async () => {
    try {
      setLoading(true)
      const { data, error } = await getUpdates(campaignId)
      if (error) throw error
      setUpdates(data || [])
    } catch (error: any) {
      console.error("Failed to load updates:", error)
      toast({
        title: "Error",
        description: "Failed to load updates. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files])
      
      // Preview images
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, result]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    // In a real app, you would upload to Supabase Storage or another service
    // For now, we'll use base64 data URLs (not recommended for production)
    // TODO: Implement proper image upload to Supabase Storage
    return formData.images
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive"
      })
      return
    }

    if (!account || account.toLowerCase() !== creatorWallet.toLowerCase()) {
      toast({
        title: "Error",
        description: "Only the campaign creator can create updates.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Upload images
      const imageUrls = await uploadImages()
      
      // Sync campaign from contract first to ensure we have complete data
      if (contract) {
        await syncCampaignFromContract(campaignId, contract)
      }
      
      let error
      if (editingId) {
        // Update existing update
        const result = await updateUpdate(
          editingId,
          creatorWallet,
          formData.title,
          formData.content,
          imageUrls.length > 0 ? imageUrls : undefined
        )
        error = result.error
      } else {
        // Create new update
        const result = await createUpdate(
          campaignId,
          creatorWallet,
          formData.title,
          formData.content,
          imageUrls.length > 0 ? imageUrls : undefined,
          contract
        )
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Success!",
        description: editingId ? "Update has been updated." : "Update has been posted.",
        variant: "default"
      })

      // Reset form
      setFormData({ title: "", content: "", images: [] })
      setImageFiles([])
      setEditingId(null)
      setShowForm(false)
      
      // Reload updates
      loadUpdates()
    } catch (error: any) {
      console.error("Failed to create update:", error)
      toast({
        title: "Error",
        description: error?.message || error?.details || JSON.stringify(error) || "Failed to create update. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (update: Update) => {
    setEditingId(update.id)
    setFormData({
      title: update.title,
      content: update.content,
      images: update.images || []
    })
    setImageFiles([])
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
    setFormData({ title: "", content: "", images: [] })
    setImageFiles([])
  }

  const handleDelete = async (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return

    try {
      setDeletingId(updateId)
      const { error } = await deleteUpdate(updateId, creatorWallet)
      if (error) throw error

      toast({
        title: "Success!",
        description: "Update has been deleted.",
        variant: "default"
      })

      loadUpdates()
    } catch (error: any) {
      console.error("Failed to delete update:", error)
      toast({
        title: "Error",
        description: "Failed to delete update. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
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
      {isCreator && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Updates</h3>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Update
            </Button>
          )}
        </div>
      )}

      {showForm && isCreator && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Update</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ title: "", content: "", images: [] })
                  setImageFiles([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="update-title">Title *</Label>
                <Input
                  id="update-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Update title..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="update-content">Content *</Label>
                <Textarea
                  id="update-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share project progress..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="update-images">Images (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="update-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('update-images')?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Images
                  </Button>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    editingId ? "Update" : "Post Update"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isCreator ? "No updates yet. Create your first update!" : "No updates from the campaign creator yet."}
          </div>
        ) : (
          updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold">{update.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {isCreator && account?.toLowerCase() === creatorWallet.toLowerCase() && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(update)}
                        disabled={deletingId === update.id || editingId === update.id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(update.id)}
                        disabled={deletingId === update.id || editingId === update.id}
                      >
                        {deletingId === update.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap mb-4 text-left">{update.content}</p>
                
                {update.images && update.images.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {update.images.map((img, index) => (
                      <div key={index} className="flex justify-center">
                        <img
                          src={img}
                          alt={`Update image ${index + 1}`}
                          className="max-w-full max-h-96 object-contain rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

