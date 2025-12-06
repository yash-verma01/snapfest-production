import { Cart, Package, BeatBloom, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole; // Set by authenticate middleware
  
  // Return empty cart for admin users (temporary fix to prevent 401 errors in admin UI)
  // Admin UI doesn't use cart functionality - they manage packages/events through admin dashboard
  if (userRole === 'admin') {
    console.log('🛒 Cart Controller: Admin user detected, returning empty cart (not applicable for admin UI)');
    return res.status(200).json({
      success: true,
      data: {
        cartItems: [],
        totalAmount: 0,
        itemCount: 0
      },
      message: 'Cart not applicable for admin UI'
    });
  }
  
  console.log('🛒 Cart Controller: Getting cart for user:', userId);

  try {
    // Optimized query with better populate options for performance
    const cartItems = await Cart.find({ userId })
      .populate({
        path: 'packageId',
        select: 'title category basePrice perGuestPrice description images'
      })
      .populate({
        path: 'beatBloomId',
        select: 'title category price description images primaryImage'
      })
      .sort({ createdAt: -1 });
    
    console.log('🛒 Cart Controller: Found cart items:', cartItems.length);

    // Filter and validate items - handle both types
    const validCartItems = cartItems.filter(item => {
      // Backward compatibility: if no itemType, assume it's a package
      const itemType = item.itemType || 'package';
      
      if (itemType === 'package') {
        if (!item.packageId || !item.packageId.title || item.packageId.basePrice === null) {
          return false;
        }
      } else if (itemType === 'beatbloom') {
        if (!item.beatBloomId || !item.beatBloomId.title || item.beatBloomId.price === null) {
          return false;
        }
      }
      return true;
    });

    // Calculate total - handle both types
    let totalAmount = 0;
    validCartItems.forEach(item => {
      try {
        const itemType = item.itemType || 'package'; // Backward compatibility
        
        if (itemType === 'package') {
          const basePrice = item.packageId.basePrice || 0;
          const perGuestPrice = item.packageId.perGuestPrice || 0;
          const itemTotal = basePrice + (perGuestPrice * (item.guests || 1));
          totalAmount += itemTotal;
        } else if (itemType === 'beatbloom') {
          const price = item.beatBloomId.price || 0;
          totalAmount += price;
        }
      } catch (error) {
        console.error('Error calculating item total:', error, 'Item:', item._id);
      }
    });

    const response = {
      success: true,
      data: {
        cartItems: validCartItems,
        totalAmount,
        itemCount: validCartItems.length
      }
    };
    
    console.log('🛒 Cart Controller: Sending response:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
  const { packageId, beatBloomId, itemType = 'package', guests, eventDate, location, customization } = req.body;
  const userId = req.userId;

  // Validate itemType
  if (!['package', 'beatbloom'].includes(itemType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid itemType. Must be "package" or "beatbloom"'
    });
  }

  if (itemType === 'package') {
    // Existing package logic - unchanged
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'packageId is required for package items'
      });
    }
    
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    const existingCartItem = await Cart.findOne({ userId, packageId, itemType: 'package' });
    
    if (existingCartItem) {
      existingCartItem.guests = guests;
      existingCartItem.eventDate = eventDate;
      existingCartItem.location = location;
      existingCartItem.customization = customization;
      await existingCartItem.save();
      await existingCartItem.populate('packageId', 'title category basePrice description images');
      
      return res.status(200).json({
        success: true,
        message: 'Cart item updated successfully',
        data: { cartItem: existingCartItem }
      });
    }

    const cartItem = await Cart.create({
      userId,
      packageId,
      itemType: 'package',
      guests: guests || 1,
      eventDate: new Date(eventDate),
      location,
      customization
    });

    await cartItem.populate('packageId', 'title category basePrice description images');

    return res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cartItem }
    });
    
  } else if (itemType === 'beatbloom') {
    // New BeatBloom logic
    if (!beatBloomId) {
      return res.status(400).json({
        success: false,
        message: 'beatBloomId is required for beatbloom items'
      });
    }
    
    const beatBloomData = await BeatBloom.findById(beatBloomId);
    if (!beatBloomData) {
      return res.status(404).json({
        success: false,
        message: 'BeatBloom service not found'
      });
    }

    const existingCartItem = await Cart.findOne({ userId, beatBloomId, itemType: 'beatbloom' });
    
    if (existingCartItem) {
      existingCartItem.eventDate = eventDate;
      existingCartItem.location = location;
      existingCartItem.customization = customization;
      await existingCartItem.save();
      await existingCartItem.populate('beatBloomId', 'title category price description images primaryImage');
      
      return res.status(200).json({
        success: true,
        message: 'Cart item updated successfully',
        data: { cartItem: existingCartItem }
      });
    }

    const cartItem = await Cart.create({
      userId,
      beatBloomId,
      itemType: 'beatbloom',
      guests: 1, // BeatBloom items don't have per-guest pricing
      eventDate: new Date(eventDate),
      location,
      customization
    });

    await cartItem.populate('beatBloomId', 'title category price description images primaryImage');

    return res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cartItem }
    });
  }
});

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { guests, eventDate, location, customization } = req.body;
  const userId = req.userId;

  const cartItem = await Cart.findOne({ _id: itemId, userId });

  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Update cart item
  if (guests) cartItem.guests = guests;
  if (eventDate) cartItem.eventDate = new Date(eventDate);
  if (location) cartItem.location = location;
  if (customization) cartItem.customization = customization;

  await cartItem.save();

  // Populate the cart item based on type
  const itemType = cartItem.itemType || 'package';
  if (itemType === 'package') {
    await cartItem.populate('packageId', 'title category basePrice description images');
  } else if (itemType === 'beatbloom') {
    await cartItem.populate('beatBloomId', 'title category price description images primaryImage');
  }

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'UPDATE',
  //     targetId: cartItem._id,
  //     description: 'Cart item updated'
  //   });

  res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    data: { cartItem }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.userId;

  const cartItem = await Cart.findOne({ _id: itemId, userId });

  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  await Cart.findByIdAndDelete(itemId);

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'DELETE',
  //     targetId: cartItem._id,
  //     description: 'Item removed from cart'
  //   });

  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully'
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const deletedCount = await Cart.deleteMany({ userId });

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'DELETE',
  //     targetId: userId,
  //     description: `Cart cleared - ${deletedCount.deletedCount} items removed`
  //   });

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: { deletedCount: deletedCount.deletedCount }
  });
});

// @desc    Get cart statistics
// @route   GET /api/cart/stats
// @access  Private
export const getCartStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const totalItems = await Cart.countDocuments({ userId });
  
  const cartItems = await Cart.find({ userId })
    .populate('packageId', 'basePrice perGuestPrice')
    .populate('beatBloomId', 'price');

  // Filter out items with invalid data - handle both types
  const validCartItems = cartItems.filter(item => {
    const itemType = item.itemType || 'package';
    if (itemType === 'package') {
      return item.packageId && 
             item.packageId.basePrice !== null && 
             item.packageId.basePrice !== undefined;
    } else if (itemType === 'beatbloom') {
      return item.beatBloomId && 
             item.beatBloomId.price !== null && 
             item.beatBloomId.price !== undefined;
    }
    return false;
  });

  let totalAmount = 0;
  validCartItems.forEach(item => {
    try {
      const itemType = item.itemType || 'package';
      if (itemType === 'package') {
        const basePrice = item.packageId.basePrice || 0;
        const perGuestPrice = item.packageId.perGuestPrice || 0;
        const itemTotal = basePrice + (perGuestPrice * (item.guests || 1));
        totalAmount += itemTotal;
      } else if (itemType === 'beatbloom') {
        const price = item.beatBloomId.price || 0;
        totalAmount += price;
      }
    } catch (error) {
      console.error('Error calculating item total in getCartStats:', error, 'Item:', item._id);
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalItems,
      totalAmount,
      averageItemValue: totalItems > 0 ? totalAmount / totalItems : 0
    }
  });
});


