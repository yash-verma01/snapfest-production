import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorAPI } from '../services/api';

const VendorProfileAPITest = () => {
  const [apiCall, setApiCall] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPICall = async () => {
    try {
      setLoading(true);
      console.log('🔍 Testing vendorAPI.getProfile()...');
      console.log('📋 vendorAPI object:', vendorAPI);
      console.log('🎯 getProfile method:', vendorAPI.getProfile);
      console.log('🌐 API endpoint being called:', '/vendors/profile');
      
      const response = await vendorAPI.getProfile();
      console.log('✅ API Response:', response);
      setApiCall(response);
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/vendor/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <span className="font-medium">← Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={testAPICall}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test API Call'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Profile API Test</h1>
          
          <div className="space-y-6">
            {/* API Call Test */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Call Test</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Expected API Endpoint:</h3>
                  <code className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                    GET /vendors/profile
                  </code>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Actual API Call Result:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {apiCall ? JSON.stringify(apiCall, null, 2) : 'Click "Test API Call" to see results'}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Error (if any):</h3>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {error || 'No error'}
                  </p>
                </div>
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
              
              <div className="space-y-3">
                <div>
                  <strong>Check Browser Console:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Open browser developer tools (F12) and check the Console tab for detailed API call logs.
                  </p>
                </div>
                
                <div>
                  <strong>Check Network Tab:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    In the Network tab, look for the API call to see which endpoint is actually being called.
                  </p>
                </div>
                
                <div>
                  <strong>Expected vs Actual:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    The API should call <code>/vendors/profile</code>, not <code>/users/profile</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Test</h2>
              
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Click the "Test API Call" button above</li>
                <li>Check the browser console for API call logs</li>
                <li>Check the Network tab to see the actual API endpoint called</li>
                <li>Verify that it calls <code>/vendors/profile</code> not <code>/users/profile</code></li>
                <li>If it's calling the wrong endpoint, there's a conflict in the API service</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileAPITest;

