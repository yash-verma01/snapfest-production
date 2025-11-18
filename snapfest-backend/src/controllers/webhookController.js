import { asyncHandler } from '../middleware/errorHandler.js';
import { Payment, Booking, AuditLog } from '../models/index.js';
import RazorpayService from '../services/razorpayService.js';

// @desc    Handle Razorpay webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public (webhook)
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  // Verify webhook signature
  const isValidSignature = RazorpayService.verifyWebhookSignature(body, signature);
  
  if (!isValidSignature) {
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }

  const event = req.body;

  try {
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event.payload.refund.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Handle payment captured
async function handlePaymentCaptured(payment) {
  try {
    // Find payment record
    const paymentRecord = await Payment.findOne({ 
      transactionId: payment.id 
    });

    if (paymentRecord) {
      // Update payment status
      paymentRecord.status = 'SUCCESS';
      paymentRecord.razorpayPaymentId = payment.id;
      paymentRecord.razorpayOrderId = payment.order_id;
      paymentRecord.paymentMethod = payment.method;
      paymentRecord.paymentDetails = {
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        card: payment.card
      };
      await paymentRecord.save();

      // Update booking status if needed
      const booking = await Booking.findById(paymentRecord.bookingId);
      if (booking) {
        // Update booking amount paid
        booking.amountPaid = booking.amountPaid + paymentRecord.amount;
        
        // Calculate payment percentage paid and remaining
        booking.paymentPercentagePaid = Math.round((booking.amountPaid / booking.totalAmount) * 100);
        booking.remainingPercentage = 100 - booking.paymentPercentagePaid;
        booking.remainingAmount = booking.totalAmount - booking.amountPaid;
        
        // Set onlinePaymentDone to true for ANY online payment
        booking.onlinePaymentDone = true;
        
        // Check if payment is complete
        if (booking.amountPaid >= booking.totalAmount) {
          booking.paymentStatus = 'FULLY_PAID';
          booking.paymentPercentagePaid = 100;
          booking.remainingPercentage = 0;
          booking.remainingAmount = 0;
        } else {
          booking.paymentStatus = 'PARTIALLY_PAID';
        }
        
        await booking.save();

        // Create audit log
        // DISABLED: await AuditLog.create({
  //           actorId: paymentRecord.userId,
  //           action: 'PAYMENT_CAPTURED',
  //           targetId: paymentRecord._id,
  //           description: `Payment of ₹${paymentRecord.amount} captured successfully via Razorpay`
  //         });
      }
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Handle payment failed
async function handlePaymentFailed(payment) {
  try {
    const paymentRecord = await Payment.findOne({ 
      transactionId: payment.id 
    });

    if (paymentRecord) {
      paymentRecord.status = 'FAILED';
      paymentRecord.failureReason = payment.error_description;
      await paymentRecord.save();

      // Create audit log
      // DISABLED: await AuditLog.create({
  //         actorId: paymentRecord.userId,
  //         action: 'PAYMENT_FAILED',
  //         targetId: paymentRecord._id,
  //         description: `Payment of ₹${paymentRecord.amount} failed: ${payment.error_description}`
  //       });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle order paid
async function handleOrderPaid(order) {
  try {
    // Find all payments for this order
    const payments = await Payment.find({ 
      razorpayOrderId: order.id 
    });

    for (const payment of payments) {
      payment.status = 'SUCCESS';
      await payment.save();
    }

    // Create audit log
    // DISABLED: await AuditLog.create({
  //       actorId: 'system',
  //       action: 'ORDER_PAID',
  //       targetId: order.id,
  //       description: `Order ${order.id} marked as paid`
  //     });
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// Handle refund created
async function handleRefundCreated(refund) {
  try {
    // Find payment record
    const paymentRecord = await Payment.findOne({ 
      razorpayPaymentId: refund.payment_id 
    });

    if (paymentRecord) {
      // Create audit log
      // DISABLED: await AuditLog.create({
  //         actorId: 'system',
  //         action: 'REFUND_CREATED',
  //         targetId: paymentRecord._id,
  //         description: `Refund of ₹${refund.amount / 100} created for payment ${refund.payment_id}`
  //       });
    }
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}

