import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

dotenv.config();

const removeDuplicateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all admins with generated emails (snapfest.local domain)
    const duplicateAdmins = await User.find({ 
      role: 'admin',
      email: { $regex: /@snapfest\.local$/i }
    });

    if (duplicateAdmins.length > 0) {
      console.log(`🔍 Found ${duplicateAdmins.length} admin(s) with generated emails:\n`);
      
      for (const admin of duplicateAdmins) {
        console.log(`   ID: ${admin._id}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Clerk ID: ${admin.clerkId}\n`);

        // Change role to user instead of deleting (safer)
        admin.role = 'user';
        await admin.save();
        console.log(`   ✅ Changed role to 'user'\n`);
      }
    } else {
      console.log('⚠️ No admins with generated emails found');
    }

    // Verify admin count
    const adminCount = await User.countDocuments({ role: 'admin' });
    const validAdmins = await User.find({ role: 'admin' }).select('name email clerkId');
    
    console.log(`\n📊 Current admin count: ${adminCount}/2`);
    console.log('\n👥 Valid admins:');
    validAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`      Clerk ID: ${admin.clerkId}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

removeDuplicateAdmin();
