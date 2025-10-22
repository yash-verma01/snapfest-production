import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vendorAPI } from '../services/api';

const VendorProfileDebug = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    const loadVendorProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading vendor profile...');
        console.log('User:', user);
        console.log('Token:', localStorage.getItem('token'));
        
        const response = await vendorAPI.getProfile();
        console.log('API Response:', response);
        setApiResponse(response);
        
        if (response.data.success) {
          setVendorData(response.data.data);
          console.log('Vendor data loaded:', response.data.data);
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error('Error loading vendor profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadVendorProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Profile Debug</h1>
              <p className="mt-2 text-gray-600">Debug vendor profile API calls</p>
            </div>
            <Link to="/vendor/dashboard">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">User Information:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Token:</h3>
              <p className="bg-gray-100 p-2 rounded text-sm">
                {localStorage.getItem('token') || 'No token found'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Loading State:</h3>
              <p className="text-sm">{loading ? 'Loading...' : 'Not loading'}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Error:</h3>
              <p className="text-sm text-red-600">{error || 'No error'}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">API Response:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Vendor Data:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(vendorData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileDebug;

