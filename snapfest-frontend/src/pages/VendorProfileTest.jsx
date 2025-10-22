import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../services/api';

const VendorProfileTest = () => {
  const [apiCall, setApiCall] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPICall = async () => {
      try {
        console.log('Testing vendorAPI.getProfile()...');
        console.log('vendorAPI object:', vendorAPI);
        console.log('getProfile method:', vendorAPI.getProfile);
        
        // Test the API call
        const response = await vendorAPI.getProfile();
        console.log('API Response:', response);
        setApiCall(response);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      }
    };

    testAPICall();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Profile API Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Call Test</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">API Call Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {apiCall ? JSON.stringify(apiCall, null, 2) : 'Loading...'}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Error:</h3>
              <p className="text-sm text-red-600">{error || 'No error'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileTest;

