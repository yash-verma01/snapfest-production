import { Enquiry, User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
// Use lazy initialization - getEmailService is a function that returns the instance
import getEmailService from '../services/emailService.js';

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public (optional auth)
export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, enquiryType, relatedId, relatedModel, subject, message, eventDate } = req.body;
  
  // If user is logged in, use their info
  let finalName = name;
  let finalEmail = email;
  let userId = null;
  
  if (req.userId) {
    const user = await User.findById(req.userId);
    if (user) {
      finalName = user.name || name;
      finalEmail = user.email || email;
      userId = user._id;
    }
  }
  
  // Validate required fields
  if (!finalName || !finalEmail || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, subject, and message are required'
    });
  }
  
  // Create enquiry
  const enquiry = await Enquiry.create({
    userId,
    name: finalName,
    email: finalEmail,
    phone: phone || null,
    enquiryType: enquiryType || 'general',
    relatedId: relatedId || null,
    relatedModel: relatedModel || null,
    subject,
    message,
    eventDate: eventDate ? new Date(eventDate) : null,
    status: 'new'
  });
  
  // Send confirmation email to user
  try {
    const result = await getEmailService().sendEnquiryConfirmationEmail(
      finalEmail,
      finalName,
      enquiryType || 'general'
    );
    
    // Check if email was actually sent or just logged (Solution 3)
    if (result && result.fallback) {
      console.warn('⚠️ Email sent in FALLBACK MODE - user will NOT receive email');
      console.warn('⚠️ Email would have been sent to:', finalEmail);
    } else {
      console.log('✅ Email successfully sent to:', finalEmail);
    }
  } catch (emailError) {
    console.error('❌ Failed to send enquiry confirmation email:', emailError);
    console.error('❌ User email:', finalEmail);
    // Don't fail the request if email fails
  }
  
  // Send notification email to admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      const result = await getEmailService().sendAdminEnquiryNotification(adminEmail, {
        name: finalName,
        email: finalEmail,
        phone: phone || 'N/A',
        enquiryType: enquiryType || 'general',
        subject,
        message
      });
      
      // Check if email was actually sent or just logged (Solution 3)
      if (result && result.fallback) {
        console.warn('⚠️ Admin notification sent in FALLBACK MODE - admin will NOT receive email');
        console.warn('⚠️ Email would have been sent to:', adminEmail);
      } else {
        console.log('✅ Admin notification successfully sent to:', adminEmail);
      }
    }
  } catch (emailError) {
    console.error('❌ Failed to send admin notification email:', emailError);
    console.error('❌ Admin email:', process.env.ADMIN_EMAIL || process.env.EMAIL_USER);
    // Don't fail the request if email fails
  }
  
  res.status(201).json({
    success: true,
    message: 'Enquiry submitted successfully',
    data: { enquiry }
  });
});

// @desc    Get all enquiries (Admin only)
// @route   GET /api/admin/enquiries
// @access  Private (Admin only)
export const getAllEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const { status, enquiryType, search } = req.query;
  
  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (enquiryType) filter.enquiryType = enquiryType;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }
  
  const enquiries = await Enquiry.find(filter)
    .populate('userId', 'name email')
    .populate('respondedBy', 'name email')
    .populate('relatedId') // Populate venue/package/event info
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Enquiry.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    data: {
      enquiries,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get enquiry by ID (Admin only)
// @route   GET /api/admin/enquiries/:id
// @access  Private (Admin only)
export const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('respondedBy', 'name email')
    .populate('relatedId');
  
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: 'Enquiry not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: { enquiry }
  });
});

// @desc    Update enquiry status (Admin only)
// @route   PUT /api/admin/enquiries/:id/status
// @access  Private (Admin only)
export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['new', 'read', 'replied', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: 'Enquiry not found'
    });
  }
  
  enquiry.status = status;
  await enquiry.save();
  
  res.status(200).json({
    success: true,
    message: 'Enquiry status updated',
    data: { enquiry }
  });
});

// @desc    Respond to enquiry (Admin only)
// @route   POST /api/admin/enquiries/:id/respond
// @access  Private (Admin only)
export const respondToEnquiry = asyncHandler(async (req, res) => {
  const { response } = req.body;
  
  if (!response || !response.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Response is required'
    });
  }
  
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: 'Enquiry not found'
    });
  }
  
  enquiry.adminResponse = response;
  enquiry.respondedBy = req.userId;
  enquiry.respondedAt = new Date();
  enquiry.status = 'replied';
  await enquiry.save();
  
  // Send response email to user
  // Check if email exists and is valid before sending
  if (!enquiry.email || enquiry.email.trim() === '') {
    console.error('❌ Cannot send email: enquiry.email is empty or null');
    console.error('❌ Enquiry ID:', enquiry._id);
    console.error('❌ Enquiry email value:', enquiry.email);
  } else {
    try {
      // Get email service instance and check initialization
      const emailService = getEmailService();
      console.log('🔍 Email Service Status Check:');
      console.log('  - Email service instance:', emailService ? 'EXISTS' : 'NULL');
      console.log('  - Email service initialized:', emailService?.initialized ? 'YES' : 'NO');
      console.log('  - SENDGRID_API_KEY exists:', process.env.SENDGRID_API_KEY ? 'YES' : 'NO');
      console.log('  - SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length || 0);
      console.log('  - EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
      
      console.log('📧 Preparing to send admin response email to:', enquiry.email);
      console.log('📧 Enquiry details:', {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        responseLength: response?.length || 0
      });
      
      console.log('📧 Calling sendAdminResponseEmail with parameters:');
      console.log('  - userEmail:', enquiry.email);
      console.log('  - userName:', enquiry.name || 'User');
      console.log('  - adminResponse length:', response?.length || 0);
      console.log('  - enquirySubject:', enquiry.subject || 'Your Enquiry');

      const result = await emailService.sendAdminResponseEmail(
        enquiry.email,
        enquiry.name || 'User',
        response,
        enquiry.subject || 'Your Enquiry'
      );
      
      console.log('✅ Admin response email successfully sent to:', enquiry.email);
      console.log('✅ Email result:', {
        success: result.success,
        messageId: result.messageId,
        provider: result.provider
      });
    } catch (emailError) {
      console.error('❌ Failed to send admin response email:', emailError);
      console.error('❌ Error message:', emailError.message);
      console.error('❌ Error stack:', emailError.stack);
      console.error('❌ Error name:', emailError.name);
      console.error('❌ User email:', enquiry.email);
      console.error('❌ Enquiry subject:', enquiry.subject);
      console.error('❌ Response length:', response?.length || 0);
      if (emailError.response) {
        console.error('❌ Error response status:', emailError.response.statusCode);
        console.error('❌ Error response body:', JSON.stringify(emailError.response.body, null, 2));
      }
      // Don't fail the request if email fails
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Response sent successfully',
    data: { enquiry }
  });
});

// @desc    Get enquiry stats (Admin only)
// @route   GET /api/admin/enquiries/stats
// @access  Private (Admin only)
export const getEnquiryStats = asyncHandler(async (req, res) => {
  const total = await Enquiry.countDocuments();
  const newCount = await Enquiry.countDocuments({ status: 'new' });
  const readCount = await Enquiry.countDocuments({ status: 'read' });
  const repliedCount = await Enquiry.countDocuments({ status: 'replied' });
  const closedCount = await Enquiry.countDocuments({ status: 'closed' });
  
  // Count by type
  const byType = await Enquiry.aggregate([
    { $group: { _id: '$enquiryType', count: { $sum: 1 } } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: {
        new: newCount,
        read: readCount,
        replied: repliedCount,
        closed: closedCount
      },
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});

