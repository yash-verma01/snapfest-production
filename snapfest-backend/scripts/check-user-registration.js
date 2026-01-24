/**
 * Script to check if users are being created in the database
 * Run: node scripts/check-user-registration.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

const checkUsers = async () => {
  try {
    await connectDB();
    
    console.log('\n=== USER REGISTRATION VERIFICATION ===\n');
    
    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total Users in Database: ${totalUsers}`);
    
    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('\n📈 Users by Role:');
    usersByRole.forEach(({ _id: role, count }) => {
      console.log(`   ${role || 'null'}: ${count}`);
    });
    
    // Get recent users (last 10)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role clerkId createdAt')
      .lean();
    
    console.log('\n👥 Recent Users (Last 10):');
    if (recentUsers.length === 0) {
      console.log('   ⚠️  No users found in database!');
    } else {
      recentUsers.forEach((user, index) => {
        const date = new Date(user.createdAt).toLocaleString();
        console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
        console.log(`      Role: ${user.role || 'null'}, ClerkId: ${user.clerkId || 'N/A'}`);
        console.log(`      Created: ${date}`);
        console.log('');
      });
    }
    
    // Check for users without clerkId
    const usersWithoutClerkId = await User.countDocuments({ clerkId: { $exists: false } });
    if (usersWithoutClerkId > 0) {
      console.log(`⚠️  Warning: ${usersWithoutClerkId} users without clerkId found!`);
    }
    
    // Check for duplicate emails
    const duplicateEmails = await User.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          users: { $push: { clerkId: '$clerkId', role: '$role' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    if (duplicateEmails.length > 0) {
      console.log('\n⚠️  Duplicate Emails Found:');
      duplicateEmails.forEach(({ _id: email, count, users }) => {
        console.log(`   ${email}: ${count} users`);
        users.forEach(u => {
          console.log(`      - ClerkId: ${u.clerkId}, Role: ${u.role}`);
        });
      });
    }
    
    // Check for users created in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    
    console.log(`\n🕐 Users Created in Last 24 Hours: ${recentRegistrations}`);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Database Connection: OK`);
    console.log(`✅ Total Users: ${totalUsers}`);
    console.log(`✅ Recent Registrations (24h): ${recentRegistrations}`);
    
    if (totalUsers === 0) {
      console.log('\n⚠️  WARNING: No users found in database!');
      console.log('   This could mean:');
      console.log('   1. No users have registered yet');
      console.log('   2. Database connection issue');
      console.log('   3. User creation is failing silently');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkUsers();
