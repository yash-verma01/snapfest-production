import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  CreditCard, 
  User, 
  Mail, 
  Phone,
  MapPin,
  Clock,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { vendorAPI } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const VendorSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      push: true,
      bookingUpdates: true,
      paymentUpdates: true,
      marketing: false
    },
    availability: {
      isActive: true,
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      advanceBookingDays: 30,
      maxBookingsPerDay: 5
    },
    payment: {
      preferredMethod: 'bank_transfer',
      bankDetails: {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: ''
      },
      upiId: '',
      autoPayout: false,
      minimumPayoutAmount: 1000
    },
    profile: {
      showContactInfo: true,
      showPortfolio: true,
      showPricing: true,
      allowDirectContact: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('notifications');
  const { handleAsync, handleApiError } = useErrorHandler();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getSettings();
      setSettings(response.data.data.settings || settings);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await vendorAPI.updateSettings(settings);
      if (response.data.success) {
        // Show success message
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      const response = await vendorAPI.changeVendorPassword(passwordData);
      if (response.data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Show success message
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                          <button
                            onClick={() => handleToggle('notifications.email', !settings.notifications.email)}
                            className="flex items-center"
                          >
                            {settings.notifications.email ? (
                              <ToggleRight className="w-8 h-8 text-blue-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Booking Updates</p>
                            <p className="text-sm text-gray-600">Get notified about booking changes</p>
                          </div>
                          <button
                            onClick={() => handleToggle('notifications.bookingUpdates', !settings.notifications.bookingUpdates)}
                            className="flex items-center"
                          >
                            {settings.notifications.bookingUpdates ? (
                              <ToggleRight className="w-8 h-8 text-blue-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-gray-400" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Payment Updates</p>
                            <p className="text-sm text-gray-600">Get notified about payments</p>
                          </div>
                          <button
                            onClick={() => handleToggle('notifications.paymentUpdates', !settings.notifications.paymentUpdates)}
                            className="flex items-center"
                          >
                            {settings.notifications.paymentUpdates ? (
                              <ToggleRight className="w-8 h-8 text-blue-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Availability Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Account Status</p>
                        <p className="text-sm text-gray-600">Make your account available for bookings</p>
                      </div>
                      <button
                        onClick={() => handleToggle('availability.isActive', !settings.availability.isActive)}
                        className="flex items-center"
                      >
                        {settings.availability.isActive ? (
                          <ToggleRight className="w-8 h-8 text-blue-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Working Hours Start
                        </label>
                        <input
                          type="time"
                          value={settings.availability.workingHours.start}
                          onChange={(e) => handleInputChange('availability.workingHours.start', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Working Hours End
                        </label>
                        <input
                          type="time"
                          value={settings.availability.workingHours.end}
                          onChange={(e) => handleInputChange('availability.workingHours.end', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Booking Days
                      </label>
                      <input
                        type="number"
                        value={settings.availability.advanceBookingDays}
                        onChange={(e) => handleInputChange('availability.advanceBookingDays', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="1"
                        max="365"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Bookings Per Day
                      </label>
                      <input
                        type="number"
                        value={settings.availability.maxBookingsPerDay}
                        onChange={(e) => handleInputChange('availability.maxBookingsPerDay', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Payment Method
                      </label>
                      <select
                        value={settings.payment.preferredMethod}
                        onChange={(e) => handleInputChange('payment.preferredMethod', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Digital Wallet</option>
                      </select>
                    </div>

                    {settings.payment.preferredMethod === 'bank_transfer' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Bank Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Number
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bankDetails.accountNumber}
                              onChange={(e) => handleInputChange('payment.bankDetails.accountNumber', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              IFSC Code
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bankDetails.ifscCode}
                              onChange={(e) => handleInputChange('payment.bankDetails.ifscCode', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bankDetails.accountHolderName}
                              onChange={(e) => handleInputChange('payment.bankDetails.accountHolderName', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bankDetails.bankName}
                              onChange={(e) => handleInputChange('payment.bankDetails.bankName', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {settings.payment.preferredMethod === 'upi' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          value={settings.payment.upiId}
                          onChange={(e) => handleInputChange('payment.upiId', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="yourname@upi"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Auto Payout</p>
                        <p className="text-sm text-gray-600">Automatically transfer earnings</p>
                      </div>
                      <button
                        onClick={() => handleToggle('payment.autoPayout', !settings.payment.autoPayout)}
                        className="flex items-center"
                      >
                        {settings.payment.autoPayout ? (
                          <ToggleRight className="w-8 h-8 text-blue-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Payout Amount
                      </label>
                      <input
                        type="number"
                        value={settings.payment.minimumPayoutAmount}
                        onChange={(e) => handleInputChange('payment.minimumPayoutAmount', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {saving ? 'Changing...' : 'Change Password'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeTab !== 'security' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSettings;

