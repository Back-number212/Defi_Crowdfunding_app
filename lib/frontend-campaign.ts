// Frontend-only campaign interface with categories
import type { Campaign } from "./contract"
import { Category, CONTRACT_CATEGORIES } from "./contract"

export interface FrontendCampaign extends Campaign {
  category: string // String representation of Category enum
}

// Convert Category enum to string
export const categoryToString = (category: Category): string => {
  return CONTRACT_CATEGORIES[category] || "Other"
}

// Convert string to Category enum
export const stringToCategory = (categoryStr: string): Category => {
  const index = CONTRACT_CATEGORIES.indexOf(categoryStr as any)
  return index !== -1 ? index : Category.Other
}

export const addCategoryToCampaign = (campaign: Campaign): FrontendCampaign => {
  return {
    ...campaign,
    category: categoryToString(campaign.category)
  }
}

export const addCategoriesToCampaigns = (campaigns: Campaign[]): FrontendCampaign[] => {
  return campaigns.map(addCategoryToCampaign)
}
