/**
 * Migration Script: Remove Old User Authentication Fields
 * 
 * This script removes authentication-related fields from User documents
 * that are now handled by Clerk:
 * - password
 * - resetPasswordToken, resetPasswordExpire
 * - isEmailVerified, emailVerificationToken, emailVerificationExpire
 * - isPhoneVerified, phoneVerificationOTP, phoneVerificationExpire
 * 
 * IMPORTANT: Run this script in staging first, then production.
 * Make sure you have a database backup before running.
 * 
 * Usage:
 *   node scripts/migrate-remove-old-user-fields.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';

// Load environment variables
dotenv.config();

// Fields to remove (handled by Clerk now)
const FIELDS_TO_REMOVE = {
  password: '',
  resetPasswordToken: '',
  resetPasswordExpire: '',
  isEmailVerified: '',
  emailVerificationToken: '',
  emailVerificationExpire: '',
  isPhoneVerified: '',
  phoneVerificationOTP: '',
  phoneVerificationExpire: ''
};

async function migrateUsers() {
  try {
    console.log('🚀 Starting migration: Remove old user authentication fields');
    console.log('⚠️  IMPORTANT: Ensure you have a database backup before proceeding!');
    console.log('');

    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Get User model
    const { User } = await import('../src/models/index.js');

    // Count users before migration
    const totalUsers = await User.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}`);
    console.log('');

    // Find users that have at least one of the old fields
    const usersWithOldFields = await User.find({
      $or: [
        { password: { $exists: true } },
        { resetPasswordToken: { $exists: true } },
        { resetPasswordExpire: { $exists: true } },
        { isEmailVerified: { $exists: true } },
        { emailVerificationToken: { $exists: true } },
        { emailVerificationExpire: { $exists: true } },
        { isPhoneVerified: { $exists: true } },
        { phoneVerificationOTP: { $exists: true } },
        { phoneVerificationExpire: { $exists: true } }
      ]
    });

    console.log(`🔍 Found ${usersWithOldFields.length} users with old authentication fields`);
    console.log('');

    if (usersWithOldFields.length === 0) {
      console.log('✅ No users found with old fields. Migration complete!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Remove old fields from all user documents
    console.log('🔄 Removing old authentication fields...');
    const result = await User.updateMany(
      {},
      {
        $unset: FIELDS_TO_REMOVE
      }
    );

    console.log(`✅ Migration complete!`);
    console.log(`📝 Documents updated: ${result.modifiedCount}`);
    console.log(`📝 Documents matched: ${result.matchedCount}`);
    console.log('');

    // Verify migration
    console.log('🔍 Verifying migration...');
    const usersWithOldFieldsAfter = await User.find({
      $or: [
        { password: { $exists: true } },
        { resetPasswordToken: { $exists: true } },
        { resetPasswordExpire: { $exists: true } },
        { isEmailVerified: { $exists: true } },
        { emailVerificationToken: { $exists: true } },
        { emailVerificationExpire: { $exists: true } },
        { isPhoneVerified: { $exists: true } },
        { phoneVerificationOTP: { $exists: true } },
        { phoneVerificationExpire: { $exists: true } }
      ]
    });

    if (usersWithOldFieldsAfter.length === 0) {
      console.log('✅ Verification passed! All old fields have been removed.');
    } else {
      console.warn(`⚠️  Warning: ${usersWithOldFieldsAfter.length} users still have old fields`);
      console.warn('   This may indicate a schema validation issue.');
    }
    console.log('');

    // Show sample of updated user
    const sampleUser = await User.findOne({}).select('clerkId email name role createdAt');
    if (sampleUser) {
      console.log('📋 Sample user after migration:');
      console.log(JSON.stringify(sampleUser.toObject(), null, 2));
    }
    console.log('');

    console.log('✅ Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Test your application to ensure everything works');
    console.log('   2. Verify users can sign in via Clerk');
    console.log('   3. Check that user profiles load correctly');
    console.log('');

    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('📝 Error details:', error.message);
    console.error('');
    console.error('⚠️  Please check the error above and try again.');
    console.error('    Make sure your database connection is working.');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run migration
migrateUsers();

