import React, { useState } from 'react';
import { Mail, Send, Users, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState('welcome');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [welcomeForm, setWelcomeForm] = useState({ userId: '' });
  const [activationForm, setActivationForm] = useState({ userId: '' });
  const [deactivationForm, setDeactivationForm] = useState({ userId: '', reason: '' });
  const [customForm, setCustomForm] = useState({ 
    userId: '', 
    subject: '', 
    message: '', 
    adminName: 'SnapFest Admin' 
  });
  const [bulkForm, setBulkForm] = useState({ 
    userIds: [], 
    subject: '', 
    message: '', 
    adminName: 'SnapFest Admin' 
  });

  // Handle welcome email
  const handleWelcomeEmail = async (e) => {
    e.preventDefault();
    if (!welcomeForm.userId) {
      toast.error('Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.sendWelcomeEmail(welcomeForm.userId);
      if (response.data.success) {
        toast.success('Welcome email sent successfully!');
        setWelcomeForm({ userId: '' });
      } else {
        toast.error(response.data.message || 'Failed to send welcome email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send welcome email');
    } finally {
      setLoading(false);
    }
  };

  // Handle activation email
  const handleActivationEmail = async (e) => {
    e.preventDefault();
    if (!activationForm.userId) {
      toast.error('Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.sendActivationEmail(activationForm.userId);
      if (response.data.success) {
        toast.success('Activation email sent successfully!');
        setActivationForm({ userId: '' });
      } else {
        toast.error(response.data.message || 'Failed to send activation email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send activation email');
    } finally {
      setLoading(false);
    }
  };

  // Handle deactivation email
  const handleDeactivationEmail = async (e) => {
    e.preventDefault();
    if (!deactivationForm.userId) {
      toast.error('Please enter a user ID');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.sendDeactivationEmail(
        deactivationForm.userId, 
        deactivationForm.reason
      );
      if (response.data.success) {
        toast.success('Deactivation email sent successfully!');
        setDeactivationForm({ userId: '', reason: '' });
      } else {
        toast.error(response.data.message || 'Failed to send deactivation email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send deactivation email');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom email
  const handleCustomEmail = async (e) => {
    e.preventDefault();
    if (!customForm.userId || !customForm.subject || !customForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.sendCustomEmail(
        customForm.userId,
        customForm.subject,
        customForm.message,
        customForm.adminName
      );
      if (response.data.success) {
        toast.success('Custom email sent successfully!');
        setCustomForm({ userId: '', subject: '', message: '', adminName: 'SnapFest Admin' });
      } else {
        toast.error(response.data.message || 'Failed to send custom email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send custom email');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk email
  const handleBulkEmail = async (e) => {
    e.preventDefault();
    if (!bulkForm.userIds.length || !bulkForm.subject || !bulkForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.sendBulkEmail(
        bulkForm.userIds,
        bulkForm.subject,
        bulkForm.message,
        bulkForm.adminName
      );
      if (response.data.success) {
        toast.success(`Bulk email sent successfully! ${response.data.data.successful} successful, ${response.data.data.failed} failed.`);
        setBulkForm({ userIds: [], subject: '', message: '', adminName: 'SnapFest Admin' });
      } else {
        toast.error(response.data.message || 'Failed to send bulk email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send bulk email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Email Management</h1>
        <p className="text-gray-600">Send emails to users and manage email communications</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'welcome', label: 'Welcome Email', icon: CheckCircle },
            { id: 'activation', label: 'Activation Email', icon: CheckCircle },
            { id: 'deactivation', label: 'Deactivation Email', icon: AlertTriangle },
            { id: 'custom', label: 'Custom Email', icon: MessageSquare },
            { id: 'bulk', label: 'Bulk Email', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Welcome Email Tab */}
      {activeTab === 'welcome' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Welcome Email</h2>
              <p className="text-gray-600">Send a welcome email to new users</p>
            </div>
          </div>

          <form onSubmit={handleWelcomeEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={welcomeForm.userId}
                onChange={(e) => setWelcomeForm({ ...welcomeForm, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter user ID"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Welcome Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Activation Email Tab */}
      {activeTab === 'activation' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Activation Email</h2>
              <p className="text-gray-600">Send an activation email to users</p>
            </div>
          </div>

          <form onSubmit={handleActivationEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={activationForm.userId}
                onChange={(e) => setActivationForm({ ...activationForm, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter user ID"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Activation Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Deactivation Email Tab */}
      {activeTab === 'deactivation' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Deactivation Email</h2>
              <p className="text-gray-600">Send a deactivation email to users</p>
            </div>
          </div>

          <form onSubmit={handleDeactivationEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={deactivationForm.userId}
                onChange={(e) => setDeactivationForm({ ...deactivationForm, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter user ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={deactivationForm.reason}
                onChange={(e) => setDeactivationForm({ ...deactivationForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter reason for deactivation"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Deactivation Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Custom Email Tab */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Custom Email</h2>
              <p className="text-gray-600">Send a custom email to a specific user</p>
            </div>
          </div>

          <form onSubmit={handleCustomEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={customForm.userId}
                onChange={(e) => setCustomForm({ ...customForm, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter user ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={customForm.subject}
                onChange={(e) => setCustomForm({ ...customForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter email subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customForm.message}
                onChange={(e) => setCustomForm({ ...customForm, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter your message"
                rows={5}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Name (Optional)
              </label>
              <input
                type="text"
                value={customForm.adminName}
                onChange={(e) => setCustomForm({ ...customForm, adminName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter admin name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Custom Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Bulk Email Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Email</h2>
              <p className="text-gray-600">Send an email to multiple users</p>
            </div>
          </div>

          <form onSubmit={handleBulkEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User IDs (comma-separated)
              </label>
              <input
                type="text"
                value={bulkForm.userIds.join(', ')}
                onChange={(e) => setBulkForm({ ...bulkForm, userIds: e.target.value.split(',').map(id => id.trim()).filter(id => id) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter user IDs separated by commas"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={bulkForm.subject}
                onChange={(e) => setBulkForm({ ...bulkForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter email subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={bulkForm.message}
                onChange={(e) => setBulkForm({ ...bulkForm, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter your message"
                rows={5}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Name (Optional)
              </label>
              <input
                type="text"
                value={bulkForm.adminName}
                onChange={(e) => setBulkForm({ ...bulkForm, adminName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter admin name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Bulk Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmailManagement;

