import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

// Load environment variables
dotenv.config();

async function updateTestUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapfest');
    console.log('✅ Connected to database');
    
    // Find test user
    const user = await User.findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log('✅ User found, updating password...');
      
      // Update password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('Test123!', 10);
      
      user.password = hashedPassword;
      user.isActive = true;
      user.isEmailVerified = true;
      await user.save();
      
      console.log('✅ User updated successfully');
      console.log('New user details:', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified
      });
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

// Run the update
updateTestUser();
