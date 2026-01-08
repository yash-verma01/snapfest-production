import mongoose from 'mongoose';

/**
 * Admin Audit Model
 * 
 * Tracks admin access for audit purposes.
 * Does NOT store passwords - only audit fields.
 * Admin authentication is handled by Clerk via publicMetadata.role.
 * 
 * Fields:
 * - clerkId: Clerk user ID (unique, indexed)
 * - email: Admin email address
 * - role: Always 'admin' (enum for consistency)
 * - lastLogin: Timestamp of last admin access
 * - createdAt, updatedAt: Automatic timestamps
 */
const adminSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    comment: 'Clerk user ID - links to Clerk user with publicMetadata.role = "admin"'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
    comment: 'Admin email address for audit tracking'
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin'],
    comment: 'Role is always admin - kept for consistency and future extensibility'
  },
  lastLogin: {
    type: Date,
    default: null,
    comment: 'Timestamp of last admin access (updated on each admin request)'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'admins' // Explicit collection name
});

// Indexes for performance
adminSchema.index({ clerkId: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ lastLogin: -1 }); // For sorting by recent activity

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
