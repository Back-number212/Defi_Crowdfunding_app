import { supabase, type Creator, type Update, type Comment, type CommentReaction } from './supabase'
import { CONTRACT_CATEGORIES } from './contract'

// ============================================
// CREATOR SERVICES
// ============================================

export async function getOrCreateCreator(walletAddress: string, displayName?: string, avatarUrl?: string) {
  // Try to get existing creator
  const { data: existing, error: fetchError } = await supabase
    .from('creators')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (existing) {
    return { data: existing, error: null }
  }

  // Create new creator if doesn't exist
  const { data, error } = await supabase
    .from('creators')
    .insert({
      wallet_address: walletAddress,
      display_name: displayName || `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      avatar_url: avatarUrl,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateCreator(walletAddress: string, updates: Partial<Creator>) {
  const { data, error } = await supabase
    .from('creators')
    .update(updates)
    .eq('wallet_address', walletAddress)
    .select()
    .single()

  return { data, error }
}

// ============================================
// CAMPAIGN SERVICES
// ============================================

async function getCreatorFromContract(campaignId: number, contract: any): Promise<string | null> {
  try {
    const allCampaigns = await contract.getAllCampaigns()
    if (campaignId >= allCampaigns.length) {
      return null
    }
    return allCampaigns[campaignId].owner
  } catch (error) {
    console.error("Failed to get creator from contract:", error)
    return null
  }
}

export async function syncCampaignFromContract(
  campaignId: number,
  contract: any
): Promise<{ data: any; error: any }> {
  try {
    // Get campaign data from smart contract
    const allCampaigns = await contract.getAllCampaigns()
    if (campaignId >= allCampaigns.length) {
      return { data: null, error: new Error(`Campaign ${campaignId} not found in contract`) }
    }

    const campaign = allCampaigns[campaignId]
    const creatorWallet = campaign.owner

    // Ensure creator exists
    const { error: creatorError } = await getOrCreateCreator(creatorWallet)
    if (creatorError) {
      return { data: null, error: creatorError }
    }

    // Prepare campaign data
    const campaignData = {
      campaign_id: campaignId,
      creator_wallet: creatorWallet,
      title: campaign.title || `Campaign ${campaignId}`,
      description: campaign.description || '',
      image_url: campaign.image || null,
      category: CONTRACT_CATEGORIES[Number(campaign.category)] || 'Other',
      target_amount: typeof campaign.target === 'bigint' ? campaign.target.toString() : campaign.target.toString(),
      amount_collected: typeof campaign.amountCollected === 'bigint' ? campaign.amountCollected.toString() : campaign.amountCollected.toString(),
      deadline: typeof campaign.deadline === 'bigint' ? Number(campaign.deadline) : Number(campaign.deadline),
      state: Number(campaign.state),
    }

    // Check if campaign exists
    const { data: existing } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    if (existing) {
      // Update existing campaign with latest data from contract
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('campaign_id', campaignId)
        .select()
        .single()

      return { data, error }
    } else {
      // Create new campaign
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single()

      return { data, error }
    }
  } catch (error: any) {
    console.error("Failed to sync campaign from contract:", error)
    return { data: null, error }
  }
}

export async function getOrCreateCampaign(
  campaignId: number,
  creatorWallet: string,
  title?: string,
  description?: string,
  contract?: any
) {
  // First ensure creator exists
  const { error: creatorError } = await getOrCreateCreator(creatorWallet)
  if (creatorError) {
    return { data: null, error: creatorError }
  }

  // Try to get existing campaign
  const { data: existing, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  // If campaign exists and has complete data, return it
  if (existing && existing.description && existing.image_url !== null && existing.deadline) {
    return { data: existing, error: null }
  }

  // If contract is provided, try to sync from contract
  if (contract) {
    const syncResult = await syncCampaignFromContract(campaignId, contract)
    if (!syncResult.error) {
      return syncResult
    }
    // If sync fails, continue with minimal data creation
  }

  // Create new campaign if doesn't exist (minimal data)
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      campaign_id: campaignId,
      creator_wallet: creatorWallet,
      title: title || `Campaign ${campaignId}`,
      description: description || '',
      target_amount: '0',
      amount_collected: '0',
      state: 0,
    })
    .select()
    .single()

  return { data, error }
}

// ============================================
// UPDATE SERVICES
// ============================================

export async function createUpdate(
  campaignId: number,
  creatorWallet: string,
  title: string,
  content: string,
  images?: string[],
  contract?: any
) {
  // Ensure creator exists first (required by foreign key)
  const { error: creatorError } = await getOrCreateCreator(creatorWallet)
  if (creatorError) {
    console.error("Failed to get or create creator:", creatorError)
    return { data: null, error: creatorError }
  }

  // Ensure campaign exists in Supabase (required by foreign key)
  // Note: contract parameter is optional - if not provided, will create minimal campaign
  const { error: campaignError } = await getOrCreateCampaign(campaignId, creatorWallet, undefined, undefined, contract)
  if (campaignError) {
    console.error("Failed to get or create campaign:", campaignError)
    return { data: null, error: campaignError }
  }

  const { data, error } = await supabase
    .from('updates')
    .insert({
      campaign_id: campaignId,
      creator_wallet: creatorWallet,
      title,
      content,
      images: images || [],
    })
    .select()
    .single()

  if (error) {
    console.error("Supabase insert error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
  }

  return { data, error }
}

export async function getUpdates(campaignId: number) {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function updateUpdate(
  updateId: string,
  creatorWallet: string,
  title: string,
  content: string,
  images?: string[]
) {
  const { data, error } = await supabase
    .from('updates')
    .update({
      title,
      content,
      images: images || [],
    })
    .eq('id', updateId)
    .eq('creator_wallet', creatorWallet)
    .select()
    .single()

  return { data, error }
}

export async function deleteUpdate(updateId: string, creatorWallet: string) {
  const { data, error } = await supabase
    .from('updates')
    .delete()
    .eq('id', updateId)
    .eq('creator_wallet', creatorWallet)

  return { data, error }
}

// ============================================
// COMMENT SERVICES
// ============================================

export async function createComment(
  campaignId: number,
  authorWallet: string,
  content?: string,
  imageUrl?: string,
  parentId?: string,
  campaignCreatorWallet?: string,
  contract?: any
) {
  // Ensure creator exists first (required by foreign key)
  const { error: creatorError } = await getOrCreateCreator(authorWallet)
  if (creatorError) {
    console.error("Failed to get or create creator:", creatorError)
    return { data: null, error: creatorError }
  }

  // Ensure campaign exists in Supabase (required by foreign key)
  // Use provided creator wallet or get from contract
  let creatorWallet = campaignCreatorWallet
  if (!creatorWallet && contract) {
    const creator = await getCreatorFromContract(campaignId, contract)
    creatorWallet = creator || authorWallet
  } else if (!creatorWallet) {
    // Try to get from existing campaign
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('creator_wallet')
      .eq('campaign_id', campaignId)
      .single()
    
    creatorWallet = existingCampaign?.creator_wallet || authorWallet
  }

  // Ensure campaign exists (sync from contract if available)
  const { error: campaignError } = await getOrCreateCampaign(campaignId, creatorWallet, undefined, undefined, contract)
  if (campaignError) {
    console.error("Failed to get or create campaign:", campaignError)
    return { data: null, error: campaignError }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      campaign_id: campaignId,
      author_wallet: authorWallet,
      content: content || null,
      image_url: imageUrl || null,
      parent_id: parentId || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Supabase insert error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
  }

  return { data, error }
}

export async function getComments(campaignId: number, creatorWallet?: string) {
  try {
    // First check if campaign exists (this might be causing the foreign key error)
    const { data: campaignExists, error: campaignCheckError } = await supabase
      .from('campaigns')
      .select('campaign_id')
      .eq('campaign_id', campaignId)
      .maybeSingle()
    
    // If campaign doesn't exist, return empty array (no comments for non-existent campaign)
    if (campaignCheckError || !campaignExists) {
      console.warn(`Campaign ${campaignId} does not exist in Supabase, returning empty comments`, campaignCheckError)
      return { data: [], error: null }
    }

    // Try to query comments - handle case where parent_id column might not exist
    // First try with parent_id filter, if it fails, query without and filter in code
    let comments: any[] = []
    let error: any = null
    
    // Try querying with parent_id filter first
    const { data: commentsWithParentId, error: errorWithParentId } = await supabase
      .from('comments')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .is('parent_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })
    
    if (errorWithParentId) {
      // Check if error is due to missing parent_id column
      const errorCode = errorWithParentId?.code || ''
      const errorMessage = errorWithParentId?.message || ''
      
      if (errorCode === '42703' && errorMessage.includes('parent_id')) {
        // parent_id column doesn't exist, query without it and filter in code
        console.warn("parent_id column doesn't exist, querying without it and filtering in code")
        
        // Try querying without deleted_at filter too, in case that column also doesn't exist
        let allComments: any[] = []
        let retryError: any = null
        
        const { data: commentsWithDeletedAt, error: errorWithDeletedAt } = await supabase
          .from('comments')
          .select('*')
          .eq('campaign_id', campaignId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
        
        if (errorWithDeletedAt && errorWithDeletedAt?.code === '42703' && errorWithDeletedAt?.message?.includes('deleted_at')) {
          // deleted_at column also doesn't exist, query without it
          console.warn("deleted_at column also doesn't exist, querying without it")
          const { data: allCommentsData, error: finalError } = await supabase
            .from('comments')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
          
          allComments = allCommentsData || []
          retryError = finalError
        } else {
          allComments = commentsWithDeletedAt || []
          retryError = errorWithDeletedAt
        }
        
        if (retryError) {
          error = retryError
        } else {
          // Filter top-level comments in code (where parent_id is null or doesn't exist)
          comments = (allComments || []).filter(comment => !comment.parent_id)
        }
      } else {
        error = errorWithParentId
      }
    } else {
      comments = commentsWithParentId || []
    }

    if (error) {
      // Log all properties of error object
      const errorKeys = Object.keys(error || {})
      const errorValues = Object.values(error || {})
      const errorString = String(error)
      let errorJSON = '{}'
      try {
        errorJSON = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      } catch (e) {
        errorJSON = String(error)
      }
      
      console.error("Supabase query error in getComments:", {
        errorObject: error,
        errorKeys,
        errorValues,
        errorString,
        errorJSON,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        campaignId,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      
      // Return empty array instead of error to prevent UI crash
      // The error is likely due to RLS or foreign key constraint
      return { data: [], error: null }
    }

    if (!comments || comments.length === 0) {
      return { data: [], error: null }
    }

  // Get reactions for all comments
  const commentIds = comments.map(c => c.id)
  let reactions: CommentReaction[] = []
  
  if (commentIds.length > 0) {
    const { data: reactionsData } = await supabase
      .from('comment_reactions')
      .select('*')
      .in('comment_id', commentIds)
    
    reactions = reactionsData || []
  }

  // Group reactions by comment_id and count by type
  const reactionsByComment = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.comment_id]) {
      acc[reaction.comment_id] = []
    }
    acc[reaction.comment_id].push(reaction)
    return acc
  }, {} as Record<string, CommentReaction[]>) || {}

  // Add reactions and mark creator comments
  const commentsWithReactions = comments.map(comment => {
    const commentReactions = reactionsByComment[comment.id] || []
    const reactionCounts = commentReactions.reduce((acc, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      ...comment,
      reactions: commentReactions,
      reaction_counts: reactionCounts,
      is_creator: creatorWallet ? comment.author_wallet.toLowerCase() === creatorWallet.toLowerCase() : false,
    }
  })

    return { data: commentsWithReactions, error: null }
  } catch (error: any) {
    console.error("Exception in getComments:", error)
    return { data: [], error: error || new Error("Unknown error in getComments") }
  }
}

export async function updateComment(
  commentId: string,
  authorWallet: string,
  content?: string,
  imageUrl?: string
) {
  const { data, error } = await supabase
    .from('comments')
    .update({
      content: content || null,
      image_url: imageUrl || null,
    })
    .eq('id', commentId)
    .eq('author_wallet', authorWallet)
    .select()
    .single()

  return { data, error }
}

export async function deleteComment(commentId: string, authorWallet: string) {
  try {
    // First check if deleted_at column exists
    // Try soft delete first
    const { data: softDeleteData, error: softDeleteError } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('author_wallet', authorWallet)
      .select()

    // If soft delete succeeds, return
    if (!softDeleteError) {
      return { data: softDeleteData, error: null }
    }

    // If error is due to missing deleted_at column (42703) or RLS policy (42501), try hard delete
    const shouldFallbackToHardDelete = 
      (softDeleteError.code === '42703' && softDeleteError.message?.includes('deleted_at')) ||
      (softDeleteError.code === '42501' && softDeleteError.message?.includes('row-level security'))

    if (shouldFallbackToHardDelete) {
      console.warn("Soft delete failed (column missing or RLS policy issue), using hard delete", {
        code: softDeleteError.code,
        message: softDeleteError.message
      })
      
      const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_wallet', authorWallet)
        .select()

      if (error) {
        console.error("Hard delete error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
      }

      return { data, error }
    }

    // If it's a different error, log and return
    console.error("Soft delete error:", {
      message: softDeleteError.message,
      details: softDeleteError.details,
      hint: softDeleteError.hint,
      code: softDeleteError.code
    })

    return { data: softDeleteData, error: softDeleteError }
  } catch (error: any) {
    console.error("Exception in deleteComment:", error)
    return { data: null, error: error || new Error("Unknown error in deleteComment") }
  }
}

// ============================================
// REACTION SERVICES
// ============================================

export async function toggleReaction(
  commentId: string,
  userWallet: string,
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
) {
  // Ensure creator exists first (required by foreign key)
  const { error: creatorError } = await getOrCreateCreator(userWallet)
  if (creatorError) {
    return { data: null, error: creatorError, removed: false }
  }

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_wallet', userWallet)
    .eq('reaction_type', reactionType)
    .single()

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('comment_reactions')
      .delete()
      .eq('id', existing.id)

    return { data: null, error, removed: true }
  } else {
    // Add reaction (remove other reactions from same user first)
    await supabase
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_wallet', userWallet)

    // Add new reaction
    const { data, error } = await supabase
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_wallet: userWallet,
        reaction_type: reactionType,
      })
      .select()
      .single()

    return { data, error, removed: false }
  }
}

export async function getUserReaction(commentId: string, userWallet: string) {
  const { data, error } = await supabase
    .from('comment_reactions')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_wallet', userWallet)
    .single()

  return { data, error }
}

