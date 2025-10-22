import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = express.Router();

// Admin login route (no auth required)
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { email, password } = req.body;
    
    // Find admin user
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    console.log('Admin login successful:', admin.email);
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
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

