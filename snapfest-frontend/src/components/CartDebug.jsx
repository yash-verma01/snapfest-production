import React, { useState, useEffect } from 'react';
import { cartAPI } from '../services/api';

const CartDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const testCartAPI = async () => {
    setLoading(true);
    const info = {
      timestamp: new Date().toISOString(),
      localStorage: {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      },
      apiTest: null,
      error: null,
      authCheck: null
    };

    try {
      console.log('🧪 CartDebug: Testing cart API...');
      console.log('🧪 CartDebug: Token:', localStorage.getItem('token'));
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      info.authCheck = {
        hasToken: !!token,
        hasUser: !!user,
        tokenLength: token ? token.length : 0,
        userParsed: user ? JSON.parse(user) : null
      };
      
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }
      
      const response = await cartAPI.getCart();
      console.log('🧪 CartDebug: API Response:', response.data);
      
      info.apiTest = {
        success: response.data.success,
        cartItems: response.data.data?.cartItems?.length || 0,
        totalAmount: response.data.data?.totalAmount || 0,
        itemCount: response.data.data?.itemCount || 0,
        rawResponse: response.data
      };
      
    } catch (error) {
      console.error('🧪 CartDebug: API Error:', error);
      info.error = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isAuthError: error.response?.status === 401
      };
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    testCartAPI();
  }, []);

  return (
    <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🧪 Cart Debug Information</h3>
      
      <div className="text-sm text-yellow-700 space-y-2">
        <div>
          <strong>Timestamp:</strong> {debugInfo.timestamp}
        </div>
        
        <div>
          <strong>Authentication:</strong>
          <ul className="ml-4">
            <li>Token: {debugInfo.authCheck?.hasToken ? '✅ Present' : '❌ Missing'}</li>
            <li>User: {debugInfo.authCheck?.hasUser ? '✅ Present' : '❌ Missing'}</li>
            <li>Token Length: {debugInfo.authCheck?.tokenLength || 0}</li>
            <li>User Email: {debugInfo.authCheck?.userParsed?.email || 'N/A'}</li>
          </ul>
        </div>

        {debugInfo.apiTest && (
          <div>
            <strong>API Test:</strong>
            <ul className="ml-4">
              <li>Success: {debugInfo.apiTest.success ? '✅' : '❌'}</li>
              <li>Cart Items: {debugInfo.apiTest.cartItems}</li>
              <li>Total Amount: ₹{debugInfo.apiTest.totalAmount}</li>
              <li>Item Count: {debugInfo.apiTest.itemCount}</li>
            </ul>
          </div>
        )}

        {debugInfo.error && (
          <div>
            <strong>Error:</strong>
            <ul className="ml-4">
              <li>Message: {debugInfo.error.message}</li>
              <li>Status: {debugInfo.error.status}</li>
              <li>Is Auth Error: {debugInfo.error.isAuthError ? '✅ Yes' : '❌ No'}</li>
              <li>Data: {JSON.stringify(debugInfo.error.data)}</li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={testCartAPI}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded text-sm"
        >
          {loading ? 'Testing...' : 'Test Cart API Again'}
        </button>
        <button
          onClick={() => {
            console.log('🛒 CartDebug: Manual refresh requested');
            window.location.reload();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default CartDebug;
