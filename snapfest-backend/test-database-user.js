import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

// Load environment variables
dotenv.config();

async function testDatabaseUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapfest');
    console.log('✅ Connected to database');
    
    // Find test user
    const user = await User.findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log('✅ User found in database');
      console.log('User details:', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      });
      
      // Check if user is active
      if (!user.isActive) {
        console.log('⚠️ User is inactive - activating user');
        user.isActive = true;
        await user.save();
        console.log('✅ User activated');
      }
      
      // Check password
      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.default.compare('Test123!', user.password);
      console.log('Password valid:', isPasswordValid);
      
    } else {
      console.log('❌ User not found in database');
      
      // Create a new user
      console.log('Creating new user...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('Test123!', 10);
      
      const newUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: true
      });
      
      console.log('✅ New user created:', newUser._id);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

// Run the test
testDatabaseUser();
