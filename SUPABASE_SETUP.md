# Supabase Setup Guide

## Step 1: Run the SQL Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase-migration.sql`
6. Click **Run** to execute the migration

This will create:
- `comments` table with proper schema
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at` timestamp

## Step 2: Verify Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ftczasczdvtbarxwqcyu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y3phc2N6ZHZ0YmFyeHdxY3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzk3MjIsImV4cCI6MjA3NTY1NTcyMn0.Cd50i6pSe-54L9-7uJWmjTaC2oJEKKE6YJMG1eUlet8
```

## Step 3: Test the Integration

1. Restart your development server if it's running
2. Open a campaign detail modal
3. Scroll to the comment section
4. Connect your wallet and try posting a comment

## Features

- ✅ Real-time comment updates (no page refresh needed)
- ✅ Persistent storage in Supabase database
- ✅ Edit and delete your own comments
- ✅ Automatic timestamps
- ✅ Wallet address as author name
- ✅ Avatar generation from wallet addresses

## Troubleshooting

If you encounter issues:

1. **Comments not loading**: Check that the SQL migration ran successfully
2. **Cannot post comments**: Verify RLS policies allow INSERT operations
3. **Real-time not working**: Ensure Supabase Realtime is enabled in your project settings

