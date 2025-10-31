import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { cartAPI } from '../services/api';
import priceCalculator from '../utils/priceCalculator';

const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isLoaded } = useUser(); // Add isLoaded to wait for Clerk data
  
  // Skip cart functionality for admin users (temporary fix)
  // IMPORTANT: Only set isAdmin when user is loaded to avoid false negatives
  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';

  const fetchCart = useCallback(async () => {
    // Skip cart fetching for admin users (temporary fix)
    // Check only if user is loaded to avoid false negatives
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      console.log('🛒 useCart: Admin user detected, skipping cart fetch');
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
      return;
    }
    
    // Don't proceed if user data isn't loaded yet
    if (!isLoaded) {
      console.log('🛒 useCart: Waiting for user data to load...');
      return;
    }
    
    console.log('🛒 useCart: Starting fetchCart...');
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 useCart: Calling cartAPI.getCart()...');
      const response = await cartAPI.getCart();
      console.log('🛒 useCart: Raw API response:', response);
      console.log('🛒 useCart: Response data:', response.data);
      
      const dataNode = response?.data?.data ?? {};
      console.log('🛒 useCart: Data node:', dataNode);
      console.log('🛒 useCart: Cart items:', dataNode.cartItems);
      console.log('🛒 useCart: Total amount:', dataNode.totalAmount);
      console.log('🛒 useCart: Item count:', dataNode.itemCount);
      
      // Normalize to { items, totalAmount, itemCount }
      const cartItems = dataNode.cartItems ?? dataNode.items ?? [];
      console.log('🛒 useCart: Raw cart items:', cartItems);
      
      // Filter out items with invalid package data
      const validCartItems = cartItems.filter(item => 
        item.packageId && 
        item.packageId.title && 
        item.packageId.basePrice !== null && 
        item.packageId.basePrice !== undefined
      );
      
      console.log('🛒 useCart: Valid cart items:', validCartItems);
      
      const normalized = {
        items: validCartItems,
        totalAmount: dataNode.totalAmount ?? 0,
        itemCount: validCartItems.length,
      };
      
      console.log('🛒 useCart: Filtered cart items:', validCartItems.length, 'valid out of', cartItems.length, 'total');
      console.log('🛒 useCart: Normalized cart:', normalized);
      setCart(normalized);
    } catch (err) {
      console.error('🛒 useCart: Error fetching cart:', err);
      console.error('🛒 useCart: Error response:', err.response?.data);
      console.error('🛒 useCart: Error status:', err.response?.status);
      
      // Handle different error types
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        setCart({ items: [], totalAmount: 0, itemCount: 0 });
      } else if (err.response?.status === 401) {
        setError('Please log in to view your cart.');
        setCart({ items: [], totalAmount: 0, itemCount: 0 });
      } else {
        setError(err.response?.data?.message || 'Failed to fetch cart');
        setCart({ items: [], totalAmount: 0, itemCount: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user]); // Update dependencies to include isLoaded and user

  const addToCart = useCallback(async (packageId, customization = {}, extra = {}) => {
    console.log('🛒 useCart: Starting addToCart...');
    console.log('🛒 useCart: packageId:', packageId);
    console.log('🛒 useCart: customization:', customization);
    console.log('🛒 useCart: extra:', extra);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('🛒 useCart: Token exists:', !!token);
    console.log('🛒 useCart: Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    
    setLoading(true);
    setError(null);

    try {
      // Prepare request data in the format expected by backend
      const requestData = {
        packageId,
        guests: extra.guests || 1,
        eventDate: extra.eventDate || new Date().toISOString().split('T')[0],
        location: extra.location || '',
        customization: Object.keys(customization).length ? JSON.stringify(customization) : ''
      };
      
      console.log('🛒 useCart: Final request data:', requestData);
      
      console.log('🛒 useCart: Sending request to cartAPI.addToCart:', requestData);
      const response = await cartAPI.addToCart(requestData);
      console.log('🛒 useCart: API response:', response.data);
      
      if (response.data.success) {
        console.log('🛒 useCart: Add to cart successful, refreshing cart...');
        // After add, fetch cart to ensure consistency
        try {
          console.log('🛒 useCart: Refreshing cart...');
          const refreshed = await cartAPI.getCart();
          const node = refreshed?.data?.data ?? {};
          const normalized = {
            items: node.cartItems ?? [],
            totalAmount: node.totalAmount ?? 0,
            itemCount: node.itemCount ?? (node.cartItems ? node.cartItems.length : 0),
          };
          console.log('🛒 useCart: Normalized cart:', normalized);
          setCart(normalized);
          return normalized;
        } catch (refreshErr) {
          console.error('🛒 useCart: Error refreshing cart after add:', refreshErr);
          // Fallback to minimal state if refresh fails
          setCart((prev) => prev || { items: [], totalAmount: 0, itemCount: 0 });
          return null;
        }
      } else {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('🛒 useCart: Error adding to cart:', err);
      console.error('🛒 useCart: Error response:', err.response?.data);
      console.error('🛒 useCart: Error status:', err.response?.status);
      console.error('🛒 useCart: Error message:', err.message);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError('Please log in to add items to cart.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid request. Please check your input.');
      } else if (err.response?.status === 404) {
        setError('Package not found. Please try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to add to cart');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCartItem = useCallback(async (itemId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cartAPI.updateCartItem(itemId, updates);
      const updatedCart = response.data.data.cart;
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cartAPI.removeFromCart(itemId);
      console.log('🛒 useCart: Remove response:', response.data);
      
      if (response.data.success) {
        // After successful deletion, fetch the updated cart
        console.log('🛒 useCart: Item deleted successfully, fetching updated cart...');
        const updatedCartResponse = await cartAPI.getCart();
        const dataNode = updatedCartResponse?.data?.data ?? {};
        const normalized = {
          items: dataNode.cartItems ?? [],
          totalAmount: dataNode.totalAmount ?? 0,
          itemCount: dataNode.itemCount ?? (dataNode.cartItems ? dataNode.cartItems.length : 0),
        };
        console.log('🛒 useCart: Updated cart:', normalized);
        setCart(normalized);
        return normalized;
      } else {
        throw new Error(response.data.message || 'Failed to remove from cart');
      }
    } catch (err) {
      console.error('🛒 useCart: Error removing from cart:', err);
      setError(err.response?.data?.message || 'Failed to remove from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await cartAPI.clearCart();
      setCart(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateTotal = useCallback((cartItems) => {
    if (!cartItems || cartItems.length === 0) return { itemCount: 0, total: 0, subtotal: 0, addOnsTotal: 0, travelFee: 0, tax: 0 };

    let subtotal = 0;
    let addOnsTotal = 0;
    let travelFee = 0;

    cartItems.forEach(item => {
      // Use packageId instead of package for data access
      const packageData = item.packageId || item.package || {};
      
      // Skip items with invalid package data
      if (!packageData || !packageData.title || packageData.basePrice === null || packageData.basePrice === undefined) {
        console.warn('🛒 useCart: Skipping item with invalid package data:', item._id);
        return;
      }
      
      // Calculate base price
      const basePrice = packageData.basePrice || 0;
      const perGuestPrice = packageData.perGuestPrice || 0;
      const guests = item.guests || 1;
      
      // Calculate item total
      const itemTotal = basePrice + (perGuestPrice * guests);
      subtotal += itemTotal;
      
      // Add any add-ons
      if (item.addOns && item.addOns.length > 0) {
        item.addOns.forEach(addOn => {
          addOnsTotal += addOn.price || 0;
        });
      }
      
      // Add travel fee if location is far
      if (item.location && item.location.toLowerCase().includes('outstation')) {
        travelFee += 2000; // Fixed travel fee for outstation
      }
    });

    const total = subtotal + addOnsTotal + travelFee;
    const tax = total * 0.18; // 18% GST
    const finalTotal = total + tax;

    return {
      itemCount: cartItems.length,
      total: finalTotal,
      subtotal,
      addOnsTotal,
      travelFee,
      tax
    };
  }, []);

  const getCartStats = useCallback(() => {
    if (!cart) return { itemCount: 0, total: 0 };

    const itemCount = cart.items?.length || 0;
    const total = calculateTotal(cart.items);

    return { itemCount, total };
  }, [cart, calculateTotal]);

  useEffect(() => {
    // Wait for Clerk user data to load first
    if (!isLoaded) {
      console.log('🛒 useCart: Waiting for Clerk user data to load...');
      return;
    }
    
    // Skip cart fetching for admin users (temporary fix to prevent 401 errors)
    if (isAdmin) {
      console.log('🛒 useCart: Admin user detected, skipping cart fetch (not applicable for admin UI)');
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
      return;
    }
    
    // Check authentication and fetch cart using Clerk authentication
    // Don't check localStorage - rely on Clerk authentication instead
    if (user) {
      console.log('🛒 useCart: User authenticated via Clerk, fetching cart...');
      fetchCart();
    } else {
      console.log('🛒 useCart: User not authenticated, setting empty cart');
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    }
    
    // Note: Clerk handles auth state changes automatically via useUser hook
    // No need for localStorage listeners - Clerk manages authentication state
  }, [fetchCart, isAdmin, isLoaded, user]); // Add dependencies

  const refreshCart = useCallback(() => {
    console.log('🛒 useCart: Manual cart refresh requested...');
    
    // Use Clerk authentication instead of localStorage
    if (isLoaded && user && user?.publicMetadata?.role !== 'admin') {
      console.log('🛒 useCart: Refreshing cart with Clerk authentication...');
      fetchCart();
    } else if (isLoaded && user?.publicMetadata?.role === 'admin') {
      console.log('🛒 useCart: Admin user detected, skipping cart refresh');
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    } else {
      console.log('🛒 useCart: No authentication or user not loaded, cannot refresh cart');
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    }
  }, [fetchCart, isLoaded, user]); // Update dependencies

  return {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    calculateTotal,
    getCartStats,
    refresh: fetchCart,
    refreshCart
  };
};

export default useCart;
