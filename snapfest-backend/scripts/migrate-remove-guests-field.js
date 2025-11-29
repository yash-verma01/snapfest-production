import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import Booking model
import Booking from '../src/models/Booking.js';

async function migrate() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Remove guests field from all bookings
    const result = await Booking.updateMany(
      {},
      { $unset: { guests: "" } }
    );

    console.log(`✅ Removed guests field from ${result.modifiedCount} bookings`);
    
    // Add new OTP fields with default values (only for bookings that don't have them)
    // Note: Mongoose will automatically add these fields with defaults for new documents
    // This is just to ensure existing documents have the fields initialized
    const otpUpdateResult = await Booking.updateMany(
      {
        $or: [
          { verificationOTP: { $exists: false } },
          { verificationOTPExpiresAt: { $exists: false } },
          { verificationOTPGeneratedAt: { $exists: false } },
          { verificationOTPGeneratedBy: { $exists: false } }
        ]
      },
      {
        $set: {
          verificationOTP: null,
          verificationOTPExpiresAt: null,
          verificationOTPGeneratedAt: null,
          verificationOTPGeneratedBy: null
        }
      }
    );

    console.log(`✅ Added OTP fields to ${otpUpdateResult.modifiedCount} bookings`);
    console.log('✅ Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();








