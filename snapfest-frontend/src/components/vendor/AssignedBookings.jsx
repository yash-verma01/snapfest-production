import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, XCircle, Eye, Phone, Mail, User } from 'lucide-react';
import { vendorAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';

const AssignedBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadAssignedBookings();
  }, []);

  const loadAssignedBookings = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getAssignedBookings();
      setBookings(response.data.data.bookings);
    } catch (error) {
      console.error('Error loading assigned bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to accept this booking?')) {
      try {
        await vendorAPI.acceptBooking(bookingId);
        loadAssignedBookings();
        alert('Booking accepted successfully!');
      } catch (error) {
        console.error('Error accepting booking:', error);
        alert('Failed to accept booking. Please try again.');
      }
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await vendorAPI.rejectBooking(bookingId, { reason });
        loadAssignedBookings();
        alert('Booking rejected successfully!');
      } catch (error) {
        console.error('Error rejecting booking:', error);
        alert('Failed to reject booking. Please try again.');
      }
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading assigned bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Bookings</h2>
          <p className="text-gray-600">Manage your assigned bookings</p>
        </div>
        <div className="text-sm text-gray-500">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assigned Bookings</h3>
          <p className="text-gray-600">You don't have any assigned bookings yet.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking._id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Booking #{booking._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.packageId?.title} - {booking.packageId?.category}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1">{booking.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                      <span>{formatDate(booking.eventDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-primary-500" />
                      <span>{booking.guests} guests</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-primary-500" />
                      <span>₹{booking.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2 text-primary-500" />
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{booking.userId?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{booking.userId?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{booking.userId?.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customization Details */}
                  {booking.customization && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Customization Details</h4>
                      <p className="text-sm text-gray-700">
                        {typeof booking.customization === 'string' 
                          ? booking.customization 
                          : JSON.stringify(booking.customization, null, 2)
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetails(true);
                    }}
                    className="w-full lg:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {booking.status === 'ASSIGNED' && (
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => handleAcceptBooking(booking._id)}
                        className="w-full lg:w-auto bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Booking
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectBooking(booking._id)}
                        className="w-full lg:w-auto text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Booking
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Booking Details #{selectedBooking._id.slice(-8)}
              </h3>
              <Button variant="ghost" onClick={() => setShowDetails(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Date:</strong> {formatDate(selectedBooking.eventDate)}</p>
                    <p><strong>Location:</strong> {selectedBooking.location}</p>
                    <p><strong>Guests:</strong> {selectedBooking.guests}</p>
                    <p><strong>Package:</strong> {selectedBooking.packageId?.title}</p>
                    <p><strong>Category:</strong> {selectedBooking.packageId?.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount?.toLocaleString()}</p>
                    <p><strong>Amount Paid:</strong> ₹{selectedBooking.amountPaid?.toLocaleString()}</p>
                    <p><strong>Status:</strong> <Badge className={getStatusBadgeColor(selectedBooking.status)}>{selectedBooking.status}</Badge></p>
                  </div>
                </div>
              </div>
              
              {selectedBooking.customization && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customization</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof selectedBooking.customization === 'string' 
                        ? selectedBooking.customization 
                        : JSON.stringify(selectedBooking.customization, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedBookings;
