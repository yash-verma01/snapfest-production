import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

// Load environment variables
dotenv.config();

const checkAdminCount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count admins
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`\n📊 Admin Count: ${adminCount}/2`);

    // List all admins
    const admins = await User.find({ role: 'admin' }).select('name email clerkId createdAt');
    console.log('\n👥 Admin Users:');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   Clerk ID: ${admin.clerkId}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });

    // Check for user with email yashvrm3107@gmail.com
    const specificUser = await User.findOne({ email: 'yashvrm3107@gmail.com' });
    if (specificUser) {
      console.log(`\n🔍 Found user: ${specificUser.email}`);
      console.log(`   Role: ${specificUser.role}`);
      console.log(`   Clerk ID: ${specificUser.clerkId}`);
      console.log(`   Is Admin: ${specificUser.role === 'admin'}`);
    } else {
      console.log('\n⚠️ User yashvrm3107@gmail.com not found in database');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAdminCount();
