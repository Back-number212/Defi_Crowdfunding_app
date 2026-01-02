# Environment Variables Setup

This document lists all environment variables required for the application.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xfc7BFF0c19104f40137F386a953Ac397e53A0B3A
NEXT_PUBLIC_CHAIN_ID=11155111

# Thirdweb Configuration (Optional - if using Thirdweb SDK)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
THIRDWEB_SECRET_KEY=your-thirdweb-secret-key
```

## Variable Descriptions

### Supabase
- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous/public key

### Smart Contract
- **NEXT_PUBLIC_CONTRACT_ADDRESS**: The deployed smart contract address
- **NEXT_PUBLIC_CHAIN_ID**: The blockchain network chain ID (e.g., 11155111 for Sepolia testnet)

### Thirdweb (Optional)
- **NEXT_PUBLIC_THIRDWEB_CLIENT_ID**: Thirdweb client ID (if using Thirdweb SDK)
- **THIRDWEB_SECRET_KEY**: Thirdweb secret key (if using Thirdweb SDK)

## Important Notes

1. **Restart your dev server** after adding/changing environment variables
2. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
3. Never commit `.env.local` to version control (it's already in `.gitignore`)
4. For production deployment, add these variables in your hosting platform's environment settings

## Default Values (for reference)

- **Contract Address**: `0xfc7BFF0c19104f40137F386a953Ac397e53A0B3A` (Sepolia testnet)
- **Chain ID**: `11155111` (Sepolia testnet)

These values are now loaded from environment variables instead of being hardcoded.

