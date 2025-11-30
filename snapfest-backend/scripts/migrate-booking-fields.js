import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../src/models/Booking.js';

dotenv.config();

const migrateBookingFields = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapfest');
    console.log('✅ Connected to MongoDB');

    // Get all bookings
    const bookings = await Booking.find({});
    console.log(`📦 Found ${bookings.length} bookings to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const booking of bookings) {
      const updates = {};

      // 1. If status exists and vendorStatus doesn't, migrate status to vendorStatus
      if (booking.status && !booking.vendorStatus) {
        // Map old status values to vendorStatus
        if (['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status)) {
          updates.vendorStatus = booking.status;
        }
      }

      // 2. Calculate remainingAmount from partialAmount
      if (booking.partialAmount !== undefined && booking.remainingAmount === undefined) {
        updates.remainingAmount = Math.max(0, booking.totalAmount - booking.amountPaid);
      } else if (booking.remainingAmount === undefined) {
        // Calculate if not set
        updates.remainingAmount = Math.max(0, booking.totalAmount - (booking.amountPaid || 0));
      }

      // 3. Calculate remainingPercentage
      if (booking.paymentPercentagePaid !== undefined && booking.remainingPercentage === undefined) {
        updates.remainingPercentage = Math.max(0, 100 - booking.paymentPercentagePaid);
      } else if (booking.remainingPercentage === undefined) {
        // Default to 100 if no payment made
        updates.remainingPercentage = booking.amountPaid > 0 ? 
          Math.max(0, 100 - Math.round((booking.amountPaid / booking.totalAmount) * 100)) : 100;
      }

      // 4. Fix onlinePaymentDone - set to true if ANY online payment exists
      if (booking.onlinePaymentDone === false && booking.amountPaid > 0) {
        // Check if there are any online payments (this would require Payment model)
        // For now, we'll set it based on amountPaid > 0
        // You may need to check Payment records to be more accurate
        updates.onlinePaymentDone = booking.amountPaid > 0;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Booking.updateOne(
          { _id: booking._id },
          { $set: updates }
        );
        updated++;
        console.log(`✅ Updated booking ${booking._id}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated} bookings`);
    console.log(`   ⏭️  Skipped: ${skipped} bookings`);
    console.log(`\n✅ Migration completed successfully!`);

    // Note: The status field will remain in the database but won't be used
    // You can manually remove it later if needed using:
    // db.bookings.updateMany({}, { $unset: { status: "" } })

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration
migrateBookingFields();









