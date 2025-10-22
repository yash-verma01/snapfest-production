import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorAPI, userAPI } from '../services/api';

const VendorProfileAPIDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const debugAPI = () => {
      console.log('🔍 DEBUGGING API SERVICE...');
      
      // Check if vendorAPI exists
      console.log('📋 vendorAPI object:', vendorAPI);
      console.log('📋 vendorAPI type:', typeof vendorAPI);
      console.log('📋 vendorAPI keys:', Object.keys(vendorAPI || {}));
      
      // Check if userAPI exists
      console.log('👤 userAPI object:', userAPI);
      console.log('👤 userAPI type:', typeof userAPI);
      console.log('👤 userAPI keys:', Object.keys(userAPI || {}));
      
      // Check getProfile methods
      console.log('🎯 vendorAPI.getProfile:', vendorAPI?.getProfile);
      console.log('🎯 userAPI.getProfile:', userAPI?.getProfile);
      
      // Check if they're the same function
      console.log('🔄 Are they the same?', vendorAPI?.getProfile === userAPI?.getProfile);
      
      // Test the actual function
      if (vendorAPI?.getProfile) {
        console.log('✅ vendorAPI.getProfile exists');
        console.log('🌐 vendorAPI.getProfile function:', vendorAPI.getProfile.toString());
      } else {
        console.log('❌ vendorAPI.getProfile does not exist');
      }
      
      if (userAPI?.getProfile) {
        console.log('✅ userAPI.getProfile exists');
        console.log('🌐 userAPI.getProfile function:', userAPI.getProfile.toString());
      } else {
        console.log('❌ userAPI.getProfile does not exist');
      }
      
      setDebugInfo({
        vendorAPI: vendorAPI,
        userAPI: userAPI,
        vendorGetProfile: vendorAPI?.getProfile,
        userGetProfile: userAPI?.getProfile,
        areSame: vendorAPI?.getProfile === userAPI?.getProfile,
        vendorKeys: Object.keys(vendorAPI || {}),
        userKeys: Object.keys(userAPI || {})
      });
    };
    
    debugAPI();
  }, []);

  const testVendorAPI = async () => {
    try {
      console.log('🧪 Testing vendorAPI.getProfile()...');
      const response = await vendorAPI.getProfile();
      console.log('✅ vendorAPI response:', response);
    } catch (error) {
      console.error('❌ vendorAPI error:', error);
    }
  };

  const testUserAPI = async () => {
    try {
      console.log('🧪 Testing userAPI.getProfile()...');
      const response = await userAPI.getProfile();
      console.log('✅ userAPI response:', response);
    } catch (error) {
      console.error('❌ userAPI error:', error);
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
                onClick={testVendorAPI}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Vendor API
              </button>
              <button
                onClick={testUserAPI}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Test User API
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">API Service Debug</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vendor API Debug */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor API Debug</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">vendorAPI Object:</h3>
                  <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.vendorAPI, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">vendorAPI Keys:</h3>
                  <p className="text-sm text-gray-600">
                    {debugInfo.vendorKeys?.join(', ') || 'No keys found'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">getProfile Method:</h3>
                  <p className="text-sm text-gray-600">
                    {debugInfo.vendorGetProfile ? '✅ Exists' : '❌ Does not exist'}
                  </p>
                </div>
              </div>
            </div>

            {/* User API Debug */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User API Debug</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">userAPI Object:</h3>
                  <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.userAPI, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">userAPI Keys:</h3>
                  <p className="text-sm text-gray-600">
                    {debugInfo.userKeys?.join(', ') || 'No keys found'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">getProfile Method:</h3>
                  <p className="text-sm text-gray-600">
                    {debugInfo.userGetProfile ? '✅ Exists' : '❌ Does not exist'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Detection */}
          <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conflict Detection</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Are getProfile methods the same?</h3>
                <p className={`text-sm font-medium ${debugInfo.areSame ? 'text-red-600' : 'text-green-600'}`}>
                  {debugInfo.areSame ? '❌ YES - This is the problem!' : '✅ NO - They are different'}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Expected Result:</h3>
                <p className="text-sm text-gray-600">
                  The methods should be DIFFERENT. If they're the same, there's a conflict.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Instructions</h2>
            
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check the browser console for detailed debug logs</li>
              <li>Look for "Are they the same?" in the console</li>
              <li>If they're the same, there's a JavaScript conflict</li>
              <li>If they're different, the issue is elsewhere</li>
              <li>Click the test buttons to see actual API calls</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileAPIDebug;

