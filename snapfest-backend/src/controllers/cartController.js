import { Cart, Package, AuditLog } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.userId;
  console.log('🛒 Cart Controller: Getting cart for user:', userId);

  try {
    const cartItems = await Cart.find({ userId })
      .populate('packageId', 'title category basePrice perGuestPrice description images')
      .sort({ createdAt: -1 });
    
    console.log('🛒 Cart Controller: Found cart items:', cartItems.length);

    // Filter out items with invalid or missing package data
    const validCartItems = cartItems.filter(item => {
      if (!item.packageId) {
        console.log('Cart item has null packageId:', item._id);
        return false;
      }
      if (!item.packageId.title) {
        console.log('Cart item has null package title:', item._id);
        return false;
      }
      if (item.packageId.basePrice === null || item.packageId.basePrice === undefined) {
        console.log('Cart item has null basePrice:', item._id, 'Package:', item.packageId.title);
        return false;
      }
      if (item.packageId.perGuestPrice === null || item.packageId.perGuestPrice === undefined) {
        console.log('Cart item has null perGuestPrice:', item._id, 'Package:', item.packageId.title);
        return false;
      }
      return true;
    });

    // Calculate total with additional safety checks
    let totalAmount = 0;
    validCartItems.forEach(item => {
      try {
        const basePrice = item.packageId.basePrice || 0;
        const perGuestPrice = item.packageId.perGuestPrice || 0;
        const guests = item.guests || 1;
        const itemTotal = basePrice + (perGuestPrice * guests);
        totalAmount += itemTotal;
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
  const { packageId, guests, eventDate, location, customization } = req.body;
  const userId = req.userId;

  // Verify package exists
  const packageData = await Package.findById(packageId);
  if (!packageData) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }

  // Check if item already exists in cart
  const existingCartItem = await Cart.findOne({ userId, packageId });
  
  if (existingCartItem) {
    // Update existing item
    existingCartItem.guests = guests;
    existingCartItem.eventDate = eventDate;
    existingCartItem.location = location;
    existingCartItem.customization = customization;
    await existingCartItem.save();

    // Create audit log
    // DISABLED: await AuditLog.create({
  //       actorId: userId,
  //       action: 'UPDATE',
  //       targetId: existingCartItem._id,
  //       description: 'Cart item updated'
  //     });

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cartItem: existingCartItem }
    });
  }

  // Create new cart item
  const cartItem = await Cart.create({
    userId,
    packageId,
    guests,
    eventDate: new Date(eventDate),
    location,
    customization
  });

  // Populate the cart item
  await cartItem.populate('packageId', 'title category basePrice perGuestPrice description images');

  // Create audit log
  // DISABLED: await AuditLog.create({
  //     actorId: userId,
  //     action: 'CREATE',
  //     targetId: cartItem._id,
  //     description: 'Item added to cart'
  //   });

  res.status(201).json({
    success: true,
    message: 'Item added to cart successfully',
    data: { cartItem }
  });
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

  // Populate the cart item
  await cartItem.populate('packageId', 'title category basePrice perGuestPrice description images');

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
    .populate('packageId', 'basePrice perGuestPrice');

  // Filter out items with invalid package data
  const validCartItems = cartItems.filter(item => 
    item.packageId && 
    item.packageId.basePrice !== null && 
    item.packageId.basePrice !== undefined &&
    item.packageId.perGuestPrice !== null &&
    item.packageId.perGuestPrice !== undefined
  );

  let totalAmount = 0;
  validCartItems.forEach(item => {
    try {
      const basePrice = item.packageId.basePrice || 0;
      const perGuestPrice = item.packageId.perGuestPrice || 0;
      const guests = item.guests || 1;
      const itemTotal = basePrice + (perGuestPrice * guests);
      totalAmount += itemTotal;
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


