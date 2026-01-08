import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  CreditCard, 
  Settings
} from 'lucide-react';
import { Button, Card } from '../ui';

const QuickActions = ({ className = '' }) => {
  const actions = [
    {
      title: 'Book New Event',
      description: 'Find and book photography services',
      icon: <Plus className="w-6 h-6" />,
      link: '/packages',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      title: 'View Bookings',
      description: 'Manage your upcoming events',
      icon: <Calendar className="w-6 h-6" />,
      link: '/user/bookings',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Payment History',
      description: 'View your payment records',
      icon: <CreditCard className="w-6 h-6" />,
      link: '/user/payments',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Profile Settings',
      description: 'Update your information',
      icon: <Settings className="w-6 h-6" />,
      link: '/user/profile',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];


  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${action.color} group-hover:scale-105 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </Card>
  );
};

export default QuickActions;




