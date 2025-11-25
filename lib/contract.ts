// Contract ABI and configuration for Sepolia testnet
export const CONTRACT_ADDRESS = "0x4579eCB547f1F3fe877010F226AE938b304A364E"
export const SEPOLIA_CHAIN_ID = 11155111

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_image", "type": "string" },
      { "internalType": "uint256", "name": "_targetInWei", "type": "uint256" },
      { "internalType": "uint256", "name": "_durationInDays", "type": "uint256" },
      { "internalType": "enum CrowdFunding.Category", "name": "_category", "type": "uint8" },
      { "internalType": "string[]", "name": "_tierNames", "type": "string[]" },
      { "internalType": "uint256[]", "name": "_tierAmounts", "type": "uint256[]" }
    ],
    "name": "createCampaign",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "donateToCampaign",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCampaigns",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "owner", "type": "address" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "image", "type": "string" },
          { "internalType": "uint256", "name": "target", "type": "uint256" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountCollected", "type": "uint256" },
          { "internalType": "enum CrowdFunding.Category", "name": "category", "type": "uint8" },
          { "internalType": "enum CrowdFunding.CampaignState", "name": "state", "type": "uint8" },
          {
            "components": [
              { "internalType": "string", "name": "description", "type": "string" },
              { "internalType": "uint256", "name": "requiredAmount", "type": "uint256" }
            ],
            "internalType": "struct CrowdFunding.RewardTier[]",
            "name": "rewardTiers",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct CrowdFunding.Campaign[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "claimFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "campaigns",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "image", "type": "string" },
      { "internalType": "uint256", "name": "target", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "uint256", "name": "amountCollected", "type": "uint256" },
      { "internalType": "enum CrowdFunding.Category", "name": "category", "type": "uint8" },
      { "internalType": "enum CrowdFunding.CampaignState", "name": "state", "type": "uint8" },
      {
        "components": [
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "requiredAmount", "type": "uint256" }
        ],
        "internalType": "struct CrowdFunding.RewardTier[]",
        "name": "rewardTiers",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "numberOfCampaigns",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "contributions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "manualStopCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getCampaignTiers",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "requiredAmount", "type": "uint256" }
        ],
        "internalType": "struct CrowdFunding.RewardTier[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserContribution",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "address", "name": "_backer", "type": "address" },
      { "internalType": "uint256", "name": "_tierIndex", "type": "uint256" }
    ],
    "name": "getBackerRewardBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "string", "name": "_desc", "type": "string" },
      { "internalType": "uint256", "name": "_amountInWei", "type": "uint256" }
    ],
    "name": "addRewardTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "donor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Donated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "backer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tierIndex", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "rewardName", "type": "string" }
    ],
    "name": "RewardGranted",
    "type": "event"
  },
] as const

export interface RewardTier {
  description: string
  requiredAmount: bigint
}

export enum CampaignState {
  Active = 0,
  Successful = 1,
  Failed = 2,
  Claimed = 3
}

export enum Category {
  Art = 0,
  Technology = 1,
  Health = 2,
  Education = 3,
  Community = 4,
  Crypto = 5,
  Other = 6
}

// Contract categories as strings for frontend use
export const CONTRACT_CATEGORIES = [
  "Art",
  "Technology", 
  "Health",
  "Education",
  "Community",
  "Crypto",
  "Other"
] as const

export type ContractCategory = typeof CONTRACT_CATEGORIES[number]

export interface Campaign {
  id: number
  owner: string
  title: string
  description: string
  target: bigint
  deadline: bigint
  amountCollected: bigint
  image: string
  category: Category
  state: CampaignState
  rewardTiers: RewardTier[]
}
