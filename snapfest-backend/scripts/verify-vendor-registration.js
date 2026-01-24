/**
 * Comprehensive test script to verify vendor registration
 * Checks both Clerk public metadata and database
 * 
 * Usage:
 *   node scripts/verify-vendor-registration.js [email]
 * 
 * Example:
 *   node scripts/verify-vendor-registration.js testvendor@example.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const verifyVendorRegistration = async (email = null) => {
  try {
    await connectDB();
    
    console.log('\n🔍 === VENDOR REGISTRATION VERIFICATION ===\n');
    
    // Initialize Clerk client
    const clerkSecretKey = process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY_USER;
    if (!clerkSecretKey) {
      console.error('❌ CRITICAL: Clerk secret key not found!');
      console.error('   Set CLERK_SECRET_KEY or CLERK_SECRET_KEY_USER in .env');
      process.exit(1);
    }
    
    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
    console.log('✅ Clerk client initialized');
    console.log(`   Secret key length: ${clerkSecretKey.length} characters\n`);
    
    // If email provided, check specific user
    if (email) {
      console.log(`📧 Checking user: ${email}\n`);
      
      // Check database
      const dbUser = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      
      if (!dbUser) {
        console.log('❌ USER NOT FOUND IN DATABASE');
        console.log('   This means the sync endpoint did not create the user.\n');
        
        // Try to find by partial email match
        const partialMatch = await User.findOne({ 
          email: { $regex: email.split('@')[0], $options: 'i' } 
        }).lean();
        
        if (partialMatch) {
          console.log(`⚠️  Found similar email: ${partialMatch.email}`);
        }
      } else {
        console.log('✅ USER FOUND IN DATABASE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${dbUser.email}`);
        console.log(`👤 Name: ${dbUser.name || 'N/A'}`);
        console.log(`🔑 Role: ${dbUser.role || 'N/A'}`);
        console.log(`🆔 Clerk ID: ${dbUser.clerkId || 'N/A'}`);
        console.log(`📱 Phone: ${dbUser.phone || 'N/A'}`);
        console.log(`🏢 Business Name: ${dbUser.businessName || 'N/A'}`);
        console.log(`📅 Created At: ${new Date(dbUser.createdAt).toLocaleString()}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Check Clerk metadata if clerkId exists
        if (dbUser.clerkId) {
          try {
            const clerkUser = await clerkClient.users.getUser(dbUser.clerkId);
            const clerkMetadata = clerkUser.publicMetadata || {};
            
            console.log('✅ CLERK USER FOUND:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🆔 Clerk User ID: ${clerkUser.id}`);
            console.log(`📧 Clerk Email: ${clerkUser.emailAddresses?.[0]?.emailAddress || 'N/A'}`);
            console.log(`🔑 Clerk Public Metadata Role: ${clerkMetadata?.role || 'NOT SET'}`);
            console.log(`📋 Full Metadata:`, JSON.stringify(clerkMetadata, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            // Compare roles
            console.log('🔍 ROLE COMPARISON:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Database Role: ${dbUser.role || 'null'}`);
            console.log(`Clerk Metadata Role: ${clerkMetadata?.role || 'null'}`);
            
            if (dbUser.role === clerkMetadata?.role) {
              console.log('✅ ROLES MATCH - Everything is synced correctly!');
            } else {
              console.log('❌ ROLES MISMATCH - Sync issue detected!');
              console.log('   This will cause problems:');
              console.log('   - Admin will shift to user on refresh');
              console.log('   - Vendor dashboard may not work');
              console.log('   - Role-based access will fail');
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          } catch (clerkError) {
            console.error('❌ FAILED TO FETCH CLERK USER:');
            console.error(`   Error: ${clerkError.message}`);
            console.error(`   Clerk ID: ${dbUser.clerkId}`);
            console.error(`   Error Code: ${clerkError.errors?.[0]?.code || 'N/A'}`);
            console.error(`   Error Status: ${clerkError.status || 'N/A'}`);
            console.error('   Possible causes:');
            console.error('   1. Clerk secret key is wrong');
            console.error('   2. Clerk user ID mismatch');
            console.error('   3. Clerk API rate limit');
            console.error('   4. Network issue\n');
          }
        } else {
          console.log('⚠️  User has no Clerk ID - cannot check Clerk metadata\n');
        }
      }
    } else {
      // Check all vendors
      console.log('📊 Checking all vendors in database...\n');
      
      const vendors = await User.find({ role: 'vendor' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      console.log(`Found ${vendors.length} vendors:\n`);
      
      if (vendors.length === 0) {
        console.log('⚠️  No vendors found in database!\n');
      } else {
        for (const vendor of vendors) {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📧 Email: ${vendor.email}`);
          console.log(`👤 Name: ${vendor.name}`);
          console.log(`🆔 Clerk ID: ${vendor.clerkId || 'N/A'}`);
          console.log(`📅 Created: ${new Date(vendor.createdAt).toLocaleString()}`);
          
          if (vendor.clerkId) {
            try {
              const clerkUser = await clerkClient.users.getUser(vendor.clerkId);
              const clerkMetadata = clerkUser.publicMetadata || {};
              const clerkRole = clerkMetadata?.role || 'NOT SET';
              
              console.log(`🔑 Database Role: ${vendor.role}`);
              console.log(`🔑 Clerk Metadata Role: ${clerkRole}`);
              
              if (vendor.role === clerkRole) {
                console.log('✅ Roles match');
              } else {
                console.log('❌ ROLES MISMATCH!');
              }
            } catch (e) {
              console.log(`❌ Failed to fetch Clerk metadata: ${e.message}`);
            }
          } else {
            console.log('⚠️  No Clerk ID');
          }
          console.log('');
        }
      }
    }
    
    // Summary statistics
    console.log('\n📊 === SUMMARY STATISTICS ===\n');
    
    const totalUsers = await User.countDocuments();
    const vendorCount = await User.countDocuments({ role: 'vendor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    const usersWithoutClerkId = await User.countDocuments({ clerkId: { $exists: false } });
    
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Vendors: ${vendorCount}`);
    console.log(`Admins: ${adminCount}`);
    console.log(`Regular Users: ${userCount}`);
    console.log(`Users without Clerk ID: ${usersWithoutClerkId}`);
    
    // Check recent registrations (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    console.log(`\n🕐 Registrations in Last Hour: ${recentRegistrations}`);
    
    if (recentRegistrations > 0) {
      const recent = await User.find({ createdAt: { $gte: oneHourAgo } })
        .select('email role clerkId createdAt')
        .lean();
      
      console.log('\nRecent registrations:');
      recent.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ${new Date(u.createdAt).toLocaleTimeString()}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2] || null;
verifyVendorRegistration(email);
