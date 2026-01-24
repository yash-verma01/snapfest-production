/**
 * Test script to verify Azure Cosmos DB connection and check for recent users
 * This uses the Azure MONGODB_URI to connect directly
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

// Use Azure connection string if available, otherwise use local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/snapfest';

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check which database we're connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);
    
    return dbName;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkUsers = async () => {
  try {
    const dbName = await connectDB();
    
    console.log('\n=== AZURE DATABASE VERIFICATION ===\n');
    console.log(`Database Name: ${dbName}`);
    console.log(`Connection String: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}\n`);
    
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
    
    // Check for users created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    console.log(`\n🕐 Users Created in Last 7 Days: ${recentRegistrations}`);
    
    // Check for users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRegistrations = await User.countDocuments({
      createdAt: { $gte: today }
    });
    
    console.log(`🕐 Users Created Today: ${todayRegistrations}`);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Database Connection: OK`);
    console.log(`✅ Database Name: ${dbName}`);
    console.log(`✅ Total Users: ${totalUsers}`);
    console.log(`✅ Recent Registrations (7 days): ${recentRegistrations}`);
    console.log(`✅ Today's Registrations: ${todayRegistrations}`);
    
    if (totalUsers === 0) {
      console.log('\n⚠️  WARNING: No users found in database!');
    }
    
    if (recentRegistrations === 0 && totalUsers > 0) {
      console.log('\n⚠️  WARNING: No recent registrations found!');
      console.log('   This could mean:');
      console.log('   1. New registrations are failing');
      console.log('   2. Users are being created in a different database');
      console.log('   3. Sync endpoint is not being called');
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
