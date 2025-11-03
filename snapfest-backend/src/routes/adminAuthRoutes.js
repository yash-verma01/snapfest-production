import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Function to check if admin user exists (legacy - now admins are created via Clerk)
// This function is kept for backward compatibility but no longer creates users
async function ensureAdminUserExists() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin100@gmail.com';
    
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (!existingAdmin) {
      console.log('⚠️  Admin user does not exist yet.');
      console.log('📧 Expected admin email:', adminEmail);
      console.log('💡 Admin users are now created automatically when signing in via Clerk');
      console.log('   - Sign up/sign in on the Admin portal (localhost:3002)');
      console.log('   - User will be created with admin role based on email match');
    } else {
      console.log('✅ Admin user exists:', existingAdmin.email);
      if (existingAdmin.clerkId) {
        console.log('   Clerk ID:', existingAdmin.clerkId);
      } else {
        console.log('   ⚠️  Legacy admin user (no Clerk ID) - should migrate to Clerk');
      }
    }
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  }
}

const router = express.Router();

// Admin login route (no auth required)
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Admin login attempt:', req.body);
    const { email, password } = req.body;
    
    // Ensure admin user exists first
    await ensureAdminUserExists();
    
    console.log('🔍 Looking for admin with email:', email);
    const admin = await User.findOne({ email, role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Admin found:', admin.email, 'Active:', admin.isActive);
    
    if (!admin.isActive) {
      console.log('❌ Admin account is inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    console.log('🔐 Checking password...');
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password valid, generating token...');
    
    // Generate JWT token with fallback secret
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development_only';
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    console.log('🎉 Admin login successful:', admin.email);
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
export { ensureAdminUserExists };

