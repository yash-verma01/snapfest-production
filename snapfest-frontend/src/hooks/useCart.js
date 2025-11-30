import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { cartAPI } from '../services/api';
import priceCalculator from '../utils/priceCalculator';

// Global request deduplication - prevents multiple simultaneous requests
let cartFetchPromise = null;
let lastFetchTime = 0;
const FETCH_DEBOUNCE_MS = 300; // Reduced from 1000ms to 300ms for faster response

// Simple cache for cart data
const cartCache = {
  data: null,
  timestamp: 0,
  TTL: 30000 // 30 seconds cache
};

const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isLoaded } = useUser(); // Add isLoaded to wait for Clerk data
  const isFetchingRef = useRef(false); // Track if we're currently fetching
  const hasFetchedRef = useRef(false); // Track if we've fetched at least once
  
  // Skip cart functionality for admin users (temporary fix)
  // IMPORTANT: Only set isAdmin when user is loaded to avoid false negatives
  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';
  const userId = user?.id; // Use stable user ID instead of user object

  const fetchCart = useCallback(async () => {
    // Skip cart fetching for admin users
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
      return;
    }
    
    // Don't proceed if user data isn't loaded yet
    if (!isLoaded) {
      return;
    }
    
    // Check cache first
    const now = Date.now();
    if (cartCache.data && (now - cartCache.timestamp) < cartCache.TTL) {
      setCart(cartCache.data);
      setLoading(false);
      return;
    }
    
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return;
    }
    
    // Debounce rapid requests (only for non-initial loads)
    if (hasFetchedRef.current && now - lastFetchTime < FETCH_DEBOUNCE_MS && cartFetchPromise) {
      try {
        const response = await cartFetchPromise;
        const dataNode = response?.data?.data ?? {};
        const cartItems = dataNode.cartItems ?? dataNode.items ?? [];
        const validCartItems = cartItems.filter(item => {
          const itemType = item.itemType || 'package';
          if (itemType === 'package') {
            return item.packageId && 
                   item.packageId.title && 
                   item.packageId.basePrice !== null && 
                   item.packageId.basePrice !== undefined;
          } else if (itemType === 'beatbloom') {
            return item.beatBloomId && 
                   item.beatBloomId.title && 
                   item.beatBloomId.price !== null && 
                   item.beatBloomId.price !== undefined;
          }
          return false;
        });
        const normalized = {
          items: validCartItems,
          totalAmount: dataNode.totalAmount ?? 0,
          itemCount: validCartItems.length,
        };
        cartCache.data = normalized;
        cartCache.timestamp = now;
        setCart(normalized);
        return;
      } catch (err) {
        // If the shared promise failed, continue with new request
      }
    }
    
    isFetchingRef.current = true;
    lastFetchTime = now;
    setLoading(true);
    setError(null);

    try {
      cartFetchPromise = cartAPI.getCart();
      const response = await cartFetchPromise;
      
      const dataNode = response?.data?.data ?? {};
      const cartItems = dataNode.cartItems ?? dataNode.items ?? [];
      
      // Filter out items with invalid data - handle both types
      const validCartItems = cartItems.filter(item => {
        const itemType = item.itemType || 'package';
        
        if (itemType === 'package') {
          return item.packageId && 
                 item.packageId.title && 
                 item.packageId.basePrice !== null && 
                 item.packageId.basePrice !== undefined;
        } else if (itemType === 'beatbloom') {
          return item.beatBloomId && 
                 item.beatBloomId.title && 
                 item.beatBloomId.price !== null && 
                 item.beatBloomId.price !== undefined;
        }
        
        return false;
      });
      
      const normalized = {
        items: validCartItems,
        totalAmount: dataNode.totalAmount ?? 0,
        itemCount: validCartItems.length,
      };
      
      // Update cache
      cartCache.data = normalized;
      cartCache.timestamp = now;
      
      setCart(normalized);
      hasFetchedRef.current = true;
    } catch (err) {
      // Only log critical errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching cart:', err);
      }
      
      // Handle timeout specifically
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection.');
        if (!hasFetchedRef.current) {
          setCart({ items: [], totalAmount: 0, itemCount: 0 });
        }
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        setCart({ items: [], totalAmount: 0, itemCount: 0 });
      } else if (err.response?.status === 401) {
        setError('Please log in to view your cart.');
        setCart({ items: [], totalAmount: 0, itemCount: 0 });
      } else {
        setError(err.response?.data?.message || 'Failed to fetch cart');
        if (!hasFetchedRef.current) {
          setCart({ items: [], totalAmount: 0, itemCount: 0 });
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      cartFetchPromise = null;
    }
  }, [isLoaded, userId, isAdmin]);

  const addToCart = useCallback(async (itemId, customization = {}, extra = {}, itemType = 'package') => {
    setLoading(true);
    setError(null);

    try {
      // Prepare request data in the format expected by backend
      const requestData = {
        [itemType === 'package' ? 'packageId' : 'beatBloomId']: itemId,
        itemType: itemType,
        guests: extra.guests || 1,
        eventDate: extra.eventDate || new Date().toISOString().split('T')[0],
        location: extra.location || '',
        customization: Object.keys(customization).length ? JSON.stringify(customization) : ''
      };
      
      const response = await cartAPI.addToCart(requestData);
      
      if (response.data.success) {
        // Invalidate cache and refresh cart
        cartCache.data = null;
        cartCache.timestamp = 0;
        
        // After add, fetch cart to ensure consistency
        try {
          const refreshed = await cartAPI.getCart();
          const node = refreshed?.data?.data ?? {};
          const normalized = {
            items: node.cartItems ?? [],
            totalAmount: node.totalAmount ?? 0,
            itemCount: node.itemCount ?? (node.cartItems ? node.cartItems.length : 0),
          };
          
          // Update cache
          cartCache.data = normalized;
          cartCache.timestamp = Date.now();
          
          setCart(normalized);
          return normalized;
        } catch (refreshErr) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error refreshing cart after add:', refreshErr);
          }
          setCart((prev) => prev || { items: [], totalAmount: 0, itemCount: 0 });
          return null;
        }
      } else {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding to cart:', err);
      }
      
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
      
      // Invalidate cache
      cartCache.data = null;
      cartCache.timestamp = 0;
      
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
      
      if (response.data.success) {
        // Invalidate cache
        cartCache.data = null;
        cartCache.timestamp = 0;
        
        // After successful deletion, fetch the updated cart
        const updatedCartResponse = await cartAPI.getCart();
        const dataNode = updatedCartResponse?.data?.data ?? {};
        const normalized = {
          items: dataNode.cartItems ?? [],
          totalAmount: dataNode.totalAmount ?? 0,
          itemCount: dataNode.itemCount ?? (dataNode.cartItems ? dataNode.cartItems.length : 0),
        };
        
        // Update cache
        cartCache.data = normalized;
        cartCache.timestamp = Date.now();
        
        setCart(normalized);
        return normalized;
      } else {
        throw new Error(response.data.message || 'Failed to remove from cart');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing from cart:', err);
      }
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
      
      // Invalidate cache
      cartCache.data = null;
      cartCache.timestamp = 0;
      
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
      // Determine item type (backward compatible: default to 'package')
      const itemType = item.itemType || 'package';
      
      if (itemType === 'package') {
        // Use packageId instead of package for data access
        const packageData = item.packageId || item.package || {};
        
        // Skip items with invalid package data
        if (!packageData || !packageData.title || packageData.basePrice === null || packageData.basePrice === undefined) {
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
      } else if (itemType === 'beatbloom') {
        // Handle BeatBloom items
        const beatBloomData = item.beatBloomId || {};
        
        // Skip items with invalid beatbloom data
        if (!beatBloomData || !beatBloomData.title || beatBloomData.price === null || beatBloomData.price === undefined) {
          console.warn('🛒 useCart: Skipping item with invalid beatbloom data:', item._id);
          return;
        }
        
        // BeatBloom items have fixed price (no per-guest pricing)
        const price = beatBloomData.price || 0;
        subtotal += price;
      }
      
      // Add travel fee if location is far (applies to both types)
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
      return;
    }
    
    // Skip cart fetching for admin users
    if (isAdmin) {
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
      return;
    }
    
    // Check authentication and fetch cart using Clerk authentication
    if (userId) {
      fetchCart();
    } else {
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    }
  }, [fetchCart, isAdmin, isLoaded, userId]);

  const refreshCart = useCallback(() => {
    // Invalidate cache on manual refresh
    cartCache.data = null;
    cartCache.timestamp = 0;
    
    if (isLoaded && userId && user?.publicMetadata?.role !== 'admin') {
      fetchCart();
    } else if (isLoaded && user?.publicMetadata?.role === 'admin') {
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    } else {
      setCart({ items: [], totalAmount: 0, itemCount: 0 });
      setLoading(false);
    }
  }, [fetchCart, isLoaded, userId, user?.publicMetadata?.role]);

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
