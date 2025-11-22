import { Payment, Booking, AuditLog, OTP, User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import OTPService from '../services/otpService.js';
import RazorpayService from '../services/razorpayService.js';
// Use lazy initialization - getEmailService is a function that returns the instance
import getEmailService from '../services/emailService.js';

// @desc    Get user payments
// @route   GET /api/payments
// @access  Private
export const getUserPayments = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('💳 Payment Controller: Getting payments for user:', userId);

  // First get all bookings for this user
  const userBookings = await Booking.find({ userId }).select('_id');
  const bookingIds = userBookings.map(booking => booking._id);
  
  console.log('💳 Payment Controller: Found user bookings:', bookingIds.length);

  // Filter by status if provided
  let query = { bookingId: { $in: bookingIds } };
  if (req.query.status) {
    query.status = req.query.status;
  }

  const payments = await Payment.find(query)
    .populate('bookingId', 'packageId beatBloomId eventDate location totalAmount amountPaid')
    .populate('bookingId.packageId', 'title category basePrice')
    .populate('bookingId.beatBloomId', 'title category price')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(query);

  console.log('💳 Payment Controller: Found payments:', payments.length);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const payment = await Payment.findOne({ _id: id, userId })
    .populate('bookingId', 'packageId beatBloomId eventDate location status')
    .populate('bookingId.packageId', 'title category basePrice description')
    .populate('bookingId.beatBloomId', 'title category price description');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { payment }
  });
});

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
export const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, method, amount, transactionId } = req.body;
  const userId = req.userId;

  // Verify booking exists and belongs to user
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if payment already exists for this booking
  const existingPayment = await Payment.findOne({ bookingId });
  if (existingPayment) {
    return res.status(400).json({
      success: false,
      message: 'Payment already exists for this booking'
    });
  }

  // Create payment
  const payment = await Payment.create({
    userId,
    bookingId,
    method,
    amount,
    transactionId,
    status: 'PENDING'
  });

  // Populate the payment
  await payment.populate([
    { path: 'bookingId', select: 'packageId beatBloomId eventDate location' }
  ]);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'CREATE',
  //     targetId: payment._id,
  //     description: `Payment created for booking ${bookingId}`
  //   });

  res.status(201).json({
    success: true,
    message: 'Payment created successfully',
    data: { payment }
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
export const getPaymentStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const totalPayments = await Payment.countDocuments({ userId });
  const completedPayments = await Payment.countDocuments({ userId, status: 'COMPLETED' });
  const pendingPayments = await Payment.countDocuments({ userId, status: 'PENDING' });
  const failedPayments = await Payment.countDocuments({ userId, status: 'FAILED' });

  const totalAmount = await Payment.aggregate([
    { $match: { userId, status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const paymentsByMethod = await Payment.aggregate([
    { $match: { userId } },
    { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount[0]?.total || 0,
      paymentsByMethod
    }
  });
});

// ==================== RAZORPAY PAYMENT INTEGRATION ====================

// @desc    Create Razorpay order for partial payment (20%)
// @route   POST /api/payments/create-order/partial
// @access  Private
export const createPartialPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.userId;

  console.log('💳 Payment Controller: Creating partial payment order');
  console.log('💳 Payment Controller: Booking ID:', bookingId);
  console.log('💳 Payment Controller: User ID:', userId);

  // Find booking
  const booking = await Booking.findOne({ _id: bookingId, userId });
  console.log('💳 Payment Controller: Found booking:', booking);
  
  if (!booking) {
    console.log('💳 Payment Controller: Booking not found');
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking is in correct payment status
  // Allow payment if payment is pending or partially paid
  if (!['PENDING_PAYMENT', 'PARTIALLY_PAID'].includes(booking.paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Booking is not ready for payment'
    });
  }

  // Calculate partial amount based on paymentPercentage
  const partialAmount = Math.round(booking.totalAmount * (booking.paymentPercentage / 100));
  console.log('💳 Payment Controller: Booking total amount:', booking.totalAmount);
  console.log('💳 Payment Controller: Payment percentage:', booking.paymentPercentage);
  console.log('💳 Payment Controller: Calculated partial amount:', partialAmount);

  // Create Razorpay order
  console.log('💳 Payment Controller: Creating Razorpay order');
  console.log('💳 Payment Controller: Amount:', partialAmount);
  console.log('💳 Payment Controller: Currency: INR');
  
  // Create shorter receipt (max 40 chars for Razorpay)
  const shortBookingId = bookingId.toString().slice(-8); // Last 8 chars of ObjectId
  const receipt = `p_${shortBookingId}_${Date.now().toString().slice(-8)}`; // p_ + 8 chars + _ + 8 chars = 19 chars
  console.log('💳 Payment Controller: Receipt:', receipt);
  
  const orderResult = await RazorpayService.createOrder(
    partialAmount,
    'INR',
    receipt
  );

  console.log('💳 Payment Controller: Razorpay order result:', orderResult);

  if (!orderResult.success) {
    console.error('💳 Payment Controller: Razorpay order creation failed:', orderResult.error);
    return res.status(400).json({
      success: false,
      message: 'Failed to create payment order',
      error: orderResult.error
    });
  }

  // Create payment record (pending)
  console.log('💳 Payment Controller: Creating payment record');
  console.log('💳 Payment Controller: User ID:', userId);
  console.log('💳 Payment Controller: Booking ID:', bookingId);
  console.log('💳 Payment Controller: Order ID:', orderResult.order.id);
  console.log('💳 Payment Controller: Amount:', partialAmount);
  
  let payment;
  try {
    payment = await Payment.create({
      userId,
      bookingId,
      method: 'online',
      amount: partialAmount,
      transactionId: orderResult.order.id,
      razorpayOrderId: orderResult.order.id,
      status: 'PENDING'
    });
    
    console.log('💳 Payment Controller: Payment record created:', payment);
    
    // Verify the payment was actually saved
    const savedPayment = await Payment.findById(payment._id);
    console.log('💳 Payment Controller: Payment record verified in DB:', savedPayment);
    
    if (!savedPayment) {
      throw new Error('Payment record was not saved to database');
    }
  } catch (error) {
    console.error('💳 Payment Controller: Error creating payment record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment record',
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Partial payment order created successfully',
    data: {
      order: orderResult.order,
      payment,
      amount: partialAmount,
      remainingAmount: booking.totalAmount - partialAmount
    }
  });
});

// @desc    Create Razorpay order for full payment (remaining 80%)
// @route   POST /api/payments/create-order/full
// @access  Private
export const createFullPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.userId;

  // Find booking
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking is in correct payment status
  // Allow full payment if partially paid
  if (booking.paymentStatus !== 'PARTIALLY_PAID') {
    return res.status(400).json({
      success: false,
      message: 'Booking is not ready for full payment. Please make partial payment first.'
    });
  }

  // Calculate remaining amount
  const remainingAmount = booking.totalAmount - booking.amountPaid;

  // Create Razorpay order
  // Create shorter receipt (max 40 chars for Razorpay)
  const shortBookingId = bookingId.toString().slice(-8); // Last 8 chars of ObjectId
  const receipt = `f_${shortBookingId}_${Date.now().toString().slice(-8)}`; // f_ + 8 chars + _ + 8 chars = 19 chars
  
  const orderResult = await RazorpayService.createOrder(
    remainingAmount,
    'INR',
    receipt
  );

  if (!orderResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create payment order',
      error: orderResult.error
    });
  }

  // Create payment record (pending)
  const payment = await Payment.create({
    userId,
    bookingId,
    method: 'online',
    amount: remainingAmount,
    transactionId: orderResult.order.id,
    razorpayOrderId: orderResult.order.id,
    status: 'PENDING'
  });

  res.status(200).json({
    success: true,
    message: 'Full payment order created successfully',
    data: {
      order: orderResult.order,
      payment,
      amount: remainingAmount
    }
  });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  const userId = req.userId;

  console.log('💳 Payment Verification: Starting verification');
  console.log('💳 Payment Verification: Order ID:', orderId);
  console.log('💳 Payment Verification: Payment ID:', paymentId);
  console.log('💳 Payment Verification: User ID:', userId);

  // Verify payment signature
  const verificationResult = RazorpayService.verifyPaymentSignature(
    orderId,
    paymentId,
    signature
  );
  console.log('💳 Payment Verification: Signature verification result:', verificationResult);

  if (!verificationResult.success) {
    return res.status(400).json({
      success: false,
      message: verificationResult.message
    });
  }

  // Find payment record
  console.log('💳 Payment Verification: Looking for payment with razorpayOrderId:', orderId);
  let payment = await Payment.findOne({
    razorpayOrderId: orderId
  });

  console.log('💳 Payment Verification: Found payment:', payment);

  if (!payment) {
    // Try to find payment with different criteria
    console.log('💳 Payment Verification: Trying alternative search by transactionId');
    const alternativePayment = await Payment.findOne({
      transactionId: orderId
    });
    
    console.log('💳 Payment Verification: Alternative payment search result:', alternativePayment);
    
    if (alternativePayment) {
      payment = alternativePayment;
    } else {
      // Try to find by booking ID if provided
      const { bookingId } = req.body;
      console.log('💳 Payment Verification: Trying booking search with bookingId:', bookingId);
      if (bookingId) {
        const bookingPayment = await Payment.findOne({
          bookingId
        });
        console.log('💳 Payment Verification: Booking payment search result:', bookingPayment);
        
        if (bookingPayment) {
          payment = bookingPayment;
        }
      }
    }
    
    if (!payment) {
      // Debug: List all payments in database
      const allPayments = await Payment.find({});
      console.log('💳 Payment Verification: All payments in database:', allPayments.length);
      console.log('💳 Payment Verification: Recent payments:', allPayments.slice(-5));
      
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
  }

  // Update payment status
  console.log('💳 Payment Verification: Updating payment status to SUCCESS');
  console.log('💳 Payment Verification: Payment before update:', {
    id: payment._id,
    status: payment.status,
    razorpayPaymentId: payment.razorpayPaymentId
  });
  
  payment.status = 'SUCCESS';
  payment.razorpayPaymentId = paymentId;
  await payment.save();
  
  console.log('💳 Payment Verification: Payment updated successfully');
  console.log('💳 Payment Verification: Payment after update:', {
    id: payment._id,
    status: payment.status,
    razorpayPaymentId: payment.razorpayPaymentId
  });

  // Update booking
  console.log('💳 Payment Verification: Updating booking status');
  console.log('💳 Payment Verification: Payment bookingId:', payment.bookingId);
  
  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    console.log('💳 Payment Verification: Found booking:', {
      id: booking._id,
      currentAmountPaid: booking.amountPaid,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      vendorStatus: booking.vendorStatus
    });
    
    booking.amountPaid = booking.amountPaid + payment.amount;
    console.log('💳 Payment Verification: Updated amountPaid to:', booking.amountPaid);
    
    // Calculate payment percentage paid and remaining
    booking.paymentPercentagePaid = Math.round((booking.amountPaid / booking.totalAmount) * 100);
    booking.remainingPercentage = 100 - booking.paymentPercentagePaid;
    booking.remainingAmount = booking.totalAmount - booking.amountPaid;
    console.log('💳 Payment Verification: Payment percentage paid:', booking.paymentPercentagePaid);
    console.log('💳 Payment Verification: Remaining percentage:', booking.remainingPercentage);
    
    // Set onlinePaymentDone to true for ANY online payment
    booking.onlinePaymentDone = true;
    
    // Check if this completes the payment
    if (booking.amountPaid >= booking.totalAmount) {
      console.log('💳 Payment Verification: Payment is FULLY_PAID');
      booking.paymentStatus = 'FULLY_PAID';
      booking.paymentPercentagePaid = 100;
      booking.remainingPercentage = 0;
      booking.remainingAmount = 0;
      
      // Generate OTP for vendor verification
      const otp = await OTPService.createOTP(booking._id, 'FULL_PAYMENT');
      
      await booking.save();

      // Get user details and populate booking with package/beatbloom
      const user = await User.findById(userId);
      await booking.populate([
        { path: 'packageId', select: 'title' },
        { path: 'beatBloomId', select: 'title' }
      ]);
      
      // Send booking confirmation email
      const itemTitle = booking.packageId?.title || booking.beatBloomId?.title;
      if (user && user.email && itemTitle) {
        try {
          await getEmailService().sendBookingConfirmationEmail(
            user.email,
            user.name,
            {
              bookingId: booking._id.toString().slice(-8),
              packageTitle: itemTitle,
              eventDate: booking.eventDate,
              location: booking.location,
              totalAmount: booking.totalAmount,
              amountPaid: booking.amountPaid,
              remainingAmount: booking.remainingAmount,
              customization: booking.customization || ''
            }
          );
          console.log('✅ Booking confirmation email sent to:', user.email);
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
        }
      }
      
      // Send OTP to user via email
      if (user && user.email) {
        try {
          await getEmailService().sendEmail(
            user.email,
            'SnapFest - Full Payment OTP Verification',
            `
              <h2>Full Payment Completed Successfully!</h2>
              <p>Dear ${user.name},</p>
              <p>Your full payment for booking has been completed successfully.</p>
              <p><strong>Your OTP for vendor verification: ${otp.code}</strong></p>
              <p>Please share this OTP with your assigned vendor on the event day.</p>
              <p>The OTP will expire at: ${otp.expiresAt.toLocaleString()}</p>
              <p>Thank you for choosing SnapFest!</p>
            `
          );
        } catch (emailError) {
          console.error('Failed to send OTP email:', emailError);
        }
      }

      // Create audit log
      // DISABLED: await AuditLog.create({
  //         actorId: userId,
  //         action: 'FULL_PAYMENT_VERIFIED',
  //         targetId: booking._id,
  //         description: `Full payment of ₹${payment.amount} verified. OTP: ${otp.code}`
  //       });

      console.log('💳 Payment Verification: FULL PAYMENT SUCCESS - Returning response with OTP');
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully. OTP generated for vendor verification.',
        data: {
          payment,
          booking,
          otp: {
            code: otp.code,
            expiresAt: otp.expiresAt
          }
        }
      });
    } else {
      // Partial payment completed
      console.log('💳 Payment Verification: Payment is PARTIALLY_PAID');
      booking.paymentStatus = 'PARTIALLY_PAID';
      await booking.save();
      console.log('💳 Payment Verification: Booking saved with PARTIALLY_PAID status');

      // Get user details and populate booking with package/beatbloom
      const user = await User.findById(userId);
      await booking.populate([
        { path: 'packageId', select: 'title' },
        { path: 'beatBloomId', select: 'title' }
      ]);
      
      // Send booking confirmation email
      const itemTitle = booking.packageId?.title || booking.beatBloomId?.title;
      if (user && user.email && itemTitle) {
        try {
          await getEmailService().sendBookingConfirmationEmail(
            user.email,
            user.name,
            {
              bookingId: booking._id.toString().slice(-8),
              packageTitle: itemTitle,
              eventDate: booking.eventDate,
              location: booking.location,
              totalAmount: booking.totalAmount,
              amountPaid: booking.amountPaid,
              remainingAmount: booking.remainingAmount,
              customization: booking.customization || ''
            }
          );
          console.log('✅ Booking confirmation email sent to:', user.email);
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
        }
      }

      // Create audit log
      // DISABLED: await AuditLog.create({
  //         actorId: userId,
  //         action: 'PARTIAL_PAYMENT_VERIFIED',
  //         targetId: booking._id,
  //         description: `Partial payment of ₹${payment.amount} verified`
  //       });

      console.log('💳 Payment Verification: PARTIAL PAYMENT SUCCESS - Returning response');
      res.status(200).json({
        success: true,
        message: 'Partial payment verified successfully',
        data: {
          payment,
          booking,
          remainingAmount: booking.totalAmount - booking.amountPaid
        }
      });
    }
  }
});

// ==================== PAYMENT FLOW WITH OTP ====================

// @desc    Process partial payment (20%) - Legacy method
// @route   POST /api/payments/partial
// @access  Private
export const processPartialPayment = asyncHandler(async (req, res) => {
  const { bookingId, method, transactionId } = req.body;
  const userId = req.userId;

  // Find booking
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking is in correct payment status
  // Allow payment if payment is pending or partially paid
  if (!['PENDING_PAYMENT', 'PARTIALLY_PAID'].includes(booking.paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Booking is not ready for payment'
    });
  }

  // Calculate partial amount based on paymentPercentage
  const partialAmount = Math.round(booking.totalAmount * (booking.paymentPercentage / 100));

  // Create payment record
  const payment = await Payment.create({
    userId,
    bookingId,
    method,
    amount: partialAmount,
    transactionId,
    status: 'SUCCESS'
  });

  // Update booking
  booking.amountPaid = partialAmount;
  booking.remainingAmount = booking.totalAmount - partialAmount;
  booking.paymentStatus = 'PARTIALLY_PAID';
  booking.paymentPercentagePaid = Math.round((partialAmount / booking.totalAmount) * 100);
  booking.remainingPercentage = 100 - booking.paymentPercentagePaid;
  booking.onlinePaymentDone = true; // Set for ANY online payment
  await booking.save();

  // Get user details and populate booking with package/beatbloom
  const user = await User.findById(userId);
  await booking.populate([
    { path: 'packageId', select: 'title' },
    { path: 'beatBloomId', select: 'title' }
  ]);
  
  // Send booking confirmation email
  const itemTitle = booking.packageId?.title || booking.beatBloomId?.title;
  if (user && user.email && itemTitle) {
    try {
      await getEmailService().sendBookingConfirmationEmail(
        user.email,
        user.name,
        {
          bookingId: booking._id.toString().slice(-8),
          packageTitle: itemTitle,
          eventDate: booking.eventDate,
          location: booking.location,
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid,
          remainingAmount: booking.remainingAmount,
          customization: booking.customization || ''
        }
      );
      console.log('✅ Booking confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send booking confirmation email:', emailError);
    }
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'PARTIAL_PAYMENT',
  //     targetId: booking._id,
  //     description: `Partial payment of ₹${partialAmount} processed for booking ${bookingId}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Partial payment processed successfully',
    data: {
      payment,
      booking,
      remainingAmount: booking.totalAmount - partialAmount
    }
  });
});

// @desc    Process full payment (remaining 80%)
// @route   POST /api/payments/full
// @access  Private
export const processFullPayment = asyncHandler(async (req, res) => {
  const { bookingId, method, transactionId } = req.body;
  const userId = req.userId;

  // Find booking
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking is in correct payment status
  // Allow full payment if partially paid
  if (booking.paymentStatus !== 'PARTIALLY_PAID') {
    return res.status(400).json({
      success: false,
      message: 'Booking is not ready for full payment. Please make partial payment first.'
    });
  }

  // Calculate remaining amount
  const remainingAmount = booking.totalAmount - booking.amountPaid;
  
  // Create payment record
  const payment = await Payment.create({
    userId,
    bookingId,
    method,
    amount: remainingAmount,
    transactionId,
    status: 'SUCCESS'
  });

  // Update booking
  booking.amountPaid = booking.totalAmount;
  booking.remainingAmount = 0;
  booking.paymentStatus = 'FULLY_PAID';
  booking.paymentPercentagePaid = 100;
  booking.remainingPercentage = 0;
  booking.onlinePaymentDone = true; // Set for ANY online payment
  await booking.save();

  // Generate OTP for vendor verification
  const otp = await OTPService.createOTP(bookingId, 'FULL_PAYMENT');

  // Get user details and populate booking with package/beatbloom
  const user = await User.findById(userId);
  await booking.populate([
    { path: 'packageId', select: 'title' },
    { path: 'beatBloomId', select: 'title' }
  ]);
  
  // Send booking confirmation email
  const itemTitle = booking.packageId?.title || booking.beatBloomId?.title;
  if (user && user.email && itemTitle) {
    try {
      await getEmailService().sendBookingConfirmationEmail(
        user.email,
        user.name,
        {
          bookingId: booking._id.toString().slice(-8),
          packageTitle: itemTitle,
          eventDate: booking.eventDate,
          location: booking.location,
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid,
          remainingAmount: booking.remainingAmount,
          customization: booking.customization || ''
        }
      );
      console.log('✅ Booking confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send booking confirmation email:', emailError);
    }
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'FULL_PAYMENT',
  //     targetId: booking._id,
  //     description: `Full payment of ₹${remainingAmount} processed for booking ${bookingId}. OTP: ${otp.code}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Full payment processed successfully. OTP generated for vendor verification.',
    data: { 
      payment,
      booking,
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt
      }
    }
  });
});

// @desc    Confirm cash payment (Vendor)
// @route   POST /api/payments/confirm-cash
// @access  Private/Vendor
export const confirmCashPayment = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;
  const vendorId = req.userId;

  // Find booking assigned to this vendor
  const booking = await Booking.findOne({ 
    _id: bookingId, 
    assignedVendorId: vendorId 
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not assigned to you'
    });
  }

  // Update booking with cash payment
  booking.amountPaid = booking.amountPaid + amount;
  
  // Create Payment record for cash payment (for history and tracking)
  const cashPayment = await Payment.create({
    userId: booking.userId,
    bookingId: booking._id,
    method: 'CASH',
    amount: amount,
    status: 'SUCCESS',
    transactionId: `CASH-${bookingId}-${Date.now()}`,
    paymentDetails: {
      confirmedBy: vendorId,
      confirmedAt: new Date(),
      paymentType: 'cash'
    }
  });
  
  // If this completes the payment
  if (booking.amountPaid >= booking.totalAmount) {
    booking.paymentStatus = 'FULLY_PAID';
    booking.paymentPercentagePaid = 100;
    booking.remainingPercentage = 0;
    booking.remainingAmount = 0;
    
    // Generate OTP for verification
    const otp = await OTPService.createOTP(bookingId, 'FULL_PAYMENT');
    
    await booking.save();

    // Get user details and populate booking with package/beatbloom
    const user = await User.findById(booking.userId);
    await booking.populate([
      { path: 'packageId', select: 'title' },
      { path: 'beatBloomId', select: 'title' }
    ]);
    
    // Send booking confirmation email
    const itemTitle = booking.packageId?.title || booking.beatBloomId?.title;
    if (user && user.email && itemTitle) {
      try {
        await getEmailService().sendBookingConfirmationEmail(
          user.email,
          user.name,
          {
            bookingId: booking._id.toString().slice(-8),
            packageTitle: itemTitle,
            eventDate: booking.eventDate,
            location: booking.location,
            totalAmount: booking.totalAmount,
            amountPaid: booking.amountPaid,
            remainingAmount: booking.remainingAmount,
            customization: booking.customization || ''
          }
        );
        console.log('✅ Booking confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send booking confirmation email:', emailError);
      }
    }
    
    // Send OTP to user via email
    if (user && user.email) {
      try {
        await getEmailService().sendEmail(
          user.email,
          'SnapFest - Cash Payment OTP Verification',
          `
            <h2>Cash Payment Received Successfully!</h2>
            <p>Dear ${user.name},</p>
            <p>Your cash payment of ₹${amount} has been confirmed by the vendor.</p>
            <p><strong>Your OTP for final verification: ${otp.code}</strong></p>
            <p>Please share this OTP with your assigned vendor to complete the payment process.</p>
            <p>The OTP will expire at: ${otp.expiresAt.toLocaleString()}</p>
            <p>Thank you for choosing SnapFest!</p>
          `
        );
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
      }
    }

    // Create audit log
    // DISABLED: await AuditLog.create({
  //       actorId: vendorId,
  //       action: 'CASH_PAYMENT_CONFIRMED',
  //       targetId: booking._id,
  //       description: `Cash payment of ₹${amount} confirmed. OTP: ${otp.code}`
  //     });

    res.status(200).json({
      success: true,
      message: 'Cash payment confirmed. OTP generated for verification.',
      data: { 
        booking,
        payment: cashPayment,
        otp: {
          code: otp.code,
          expiresAt: otp.expiresAt
        }
      }
    });
  } else {
    // Update payment percentage for partial payment
    booking.paymentPercentagePaid = Math.round((booking.amountPaid / booking.totalAmount) * 100);
    booking.remainingPercentage = 100 - booking.paymentPercentagePaid;
    booking.remainingAmount = booking.totalAmount - booking.amountPaid;
    
    // Ensure payment status is correct for partial payment
    if (booking.paymentStatus === 'PENDING_PAYMENT' && booking.amountPaid > 0) {
      booking.paymentStatus = 'PARTIALLY_PAID';
    }
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Cash payment recorded. Partial payment received.',
      data: { 
        booking,
        payment: cashPayment,
        remainingAmount: booking.totalAmount - booking.amountPaid
      }
    });
  }
});

// @desc    Verify OTP for full payment (Vendor)
// @route   POST /api/payments/verify-otp
// @access  Private/Vendor
export const verifyPaymentOTP = asyncHandler(async (req, res) => {
  const { bookingId, otpCode } = req.body;
  const vendorId = req.userId;

  // Find booking assigned to this vendor
  const booking = await Booking.findOne({ 
    _id: bookingId, 
    assignedVendorId: vendorId,
    status: 'FULLY_PAID'
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or not ready for OTP verification'
    });
  }

  // Verify OTP
  const otpResult = await OTPService.verifyOTP(bookingId, otpCode);
  
  if (!otpResult.isValid) {
    return res.status(400).json({
      success: false,
      message: otpResult.message
    });
  }

  // Update booking
  booking.otpVerified = true;
  booking.otpVerifiedAt = new Date();
  // Note: vendorStatus should be updated by vendor, not here
  // This is just for OTP verification
  await booking.save();

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: vendorId,
  //     action: 'OTP_VERIFIED',
  //     targetId: booking._id,
  //     description: `OTP verified for booking ${bookingId}. Event can now start.`
  //   });

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully. Event can now start.',
    data: { booking }
  });
});

// ==================== REFUND MANAGEMENT ====================

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
export const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  const userId = req.userId;

  // Find payment record
  const payment = await Payment.findOne({
    _id: paymentId,
    userId
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.status !== 'SUCCESS') {
    return res.status(400).json({
      success: false,
      message: 'Only successful payments can be refunded'
    });
  }

  // Process refund through Razorpay
  const refundResult = await RazorpayService.processRefund(
    payment.razorpayPaymentId,
    amount || payment.amount,
    reason || 'Customer requested refund'
  );

  if (!refundResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Refund processing failed',
      error: refundResult.error
    });
  }

  // Update payment status
  payment.status = 'REFUNDED';
  payment.refundId = refundResult.refund.id;
  payment.refundAmount = amount || payment.amount;
  await payment.save();

  // Update booking payment status
  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    booking.amountPaid = booking.amountPaid - (amount || payment.amount);
    // Recalculate payment status
    if (booking.amountPaid <= 0) {
      booking.paymentStatus = 'PENDING_PAYMENT';
      booking.paymentPercentagePaid = 0;
      booking.remainingPercentage = 100;
      booking.remainingAmount = booking.totalAmount;
    } else if (booking.amountPaid < booking.totalAmount) {
      booking.paymentStatus = 'PARTIALLY_PAID';
      booking.paymentPercentagePaid = Math.round((booking.amountPaid / booking.totalAmount) * 100);
      booking.remainingPercentage = 100 - booking.paymentPercentagePaid;
      booking.remainingAmount = booking.totalAmount - booking.amountPaid;
    }
    // Note: vendorStatus should be updated separately if needed
    await booking.save();
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'REFUND_PROCESSED',
  //     targetId: payment._id,
  //     description: `Refund of ₹${amount || payment.amount} processed for payment ${paymentId}`
  //   });

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      refund: refundResult.refund,
      payment,
      booking
    }
  });
});

// @desc    Get refund details
// @route   GET /api/payments/refund/:refundId
// @access  Private
export const getRefundDetails = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const userId = req.userId;

  // Find payment with refund
  const payment = await Payment.findOne({
    refundId,
    userId
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Refund not found'
    });
  }

  // Get refund details from Razorpay
  const refundResult = await RazorpayService.getRefundDetails(refundId);

  if (!refundResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Failed to fetch refund details',
      error: refundResult.error
    });
  }

  res.status(200).json({
    success: true,
    data: {
      refund: refundResult.refund,
      payment
    }
  });
});

