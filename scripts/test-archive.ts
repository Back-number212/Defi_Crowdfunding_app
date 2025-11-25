// Test script to diagnose archive issues
// Run this in browser console or as a one-time check

import { supabase } from "@/lib/supabase"
import { campaignArchiveService } from "@/lib/supabase-campaigns"

export async function testArchiveSetup() {
  console.log("🔍 Testing Campaign Archive Setup...\n")
  
  // Test 1: Check Supabase connection
  console.log("1️⃣ Testing Supabase connection...")
  try {
    const { data, error } = await supabase
      .from('campaign_creators')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error("❌ Connection failed:", error.message)
      console.error("   Error code:", error.code)
      console.error("   Error details:", error.details)
      
      if (error.code === '42P01') {
        console.error("\n💡 SOLUTION: Table 'campaign_creators' doesn't exist!")
        console.error("   Run the SQL migration from 'supabase-campaign-archive.sql' in Supabase dashboard")
      } else if (error.code === '42501') {
        console.error("\n💡 SOLUTION: RLS policy blocking access!")
        console.error("   Check Row Level Security policies in Supabase")
      }
      return false
    } else {
      console.log("✅ Supabase connection successful")
    }
  } catch (err: any) {
    console.error("❌ Connection test failed:", err.message)
    return false
  }
  
  // Test 2: Check if tables exist
  console.log("\n2️⃣ Checking if tables exist...")
  const tables = ['campaign_creators', 'campaigns_archive', 'campaign_updates']
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error && error.code === '42P01') {
        console.error(`❌ Table '${table}' does not exist!`)
        console.error("   Run the SQL migration in Supabase")
        return false
      } else if (error) {
        console.warn(`⚠️  Table '${table}' exists but has error:`, error.message)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    } catch (err: any) {
      console.error(`❌ Error checking table '${table}':`, err.message)
    }
  }
  
  // Test 3: Test creating a creator
  console.log("\n3️⃣ Testing creator creation...")
  try {
    const testWallet = "0x0000000000000000000000000000000000000000"
    const creator = await campaignArchiveService.getOrCreateCreator(testWallet)
    
    if (creator) {
      console.log("✅ Creator creation works")
      // Clean up test creator
      await supabase
        .from('campaign_creators')
        .delete()
        .eq('wallet_address', testWallet)
    } else {
      console.error("❌ Creator creation failed")
      return false
    }
  } catch (err: any) {
    console.error("❌ Creator creation test failed:", err.message)
    return false
  }
  
  // Test 4: Check RLS policies
  console.log("\n4️⃣ Checking RLS policies...")
  try {
    const { data, error } = await supabase
      .from('campaigns_archive')
      .select('*')
      .limit(0)
    
    if (error && error.code === '42501') {
      console.error("❌ RLS policy blocking SELECT")
      console.error("   You may need to adjust RLS policies or disable them temporarily")
    } else {
      console.log("✅ RLS policies allow SELECT")
    }
  } catch (err: any) {
    console.warn("⚠️  Could not test RLS:", err.message)
  }
  
  console.log("\n✅ All basic tests passed!")
  console.log("   If campaigns still don't archive, check browser console for detailed logs")
  return true
}

// Run if called directly
if (typeof window !== 'undefined') {
  (window as any).testArchiveSetup = testArchiveSetup
}

