import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Eye, 
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Calendar,
  User,
  Phone,
  FileText
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Button, Badge } from '../ui';
import toast from 'react-hot-toast';

const EnquiryManagement = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadEnquiries();
    loadStats();
  }, [currentPage, searchTerm, selectedStatus, selectedType]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedType && { enquiryType: selectedType })
      };
      
      const response = await adminAPI.getEnquiries(params);
      setEnquiries(response.data.data.enquiries);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getEnquiryStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewEnquiry = async (enquiryId) => {
    try {
      const response = await adminAPI.getEnquiryById(enquiryId);
      setSelectedEnquiry(response.data.data.enquiry);
      
      // Mark as read if status is 'new'
      if (response.data.data.enquiry.status === 'new') {
        await adminAPI.updateEnquiryStatus(enquiryId, 'read');
        loadEnquiries();
        loadStats();
      }
    } catch (error) {
      console.error('Error loading enquiry:', error);
      toast.error('Failed to load enquiry details');
    }
  };

  const handleUpdateStatus = async (enquiryId, newStatus) => {
    try {
      await adminAPI.updateEnquiryStatus(enquiryId, newStatus);
      toast.success('Status updated successfully');
      loadEnquiries();
      loadStats();
      if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await adminAPI.respondToEnquiry(selectedEnquiry._id, responseText);
      toast.success('Response sent successfully');
      setShowResponseModal(false);
      setResponseText('');
      loadEnquiries();
      loadStats();
      if (selectedEnquiry) {
        setSelectedEnquiry({ ...selectedEnquiry, status: 'replied', adminResponse: responseText });
      }
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      read: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      replied: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.new;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      venue: 'bg-pink-100 text-pink-800',
      package: 'bg-purple-100 text-purple-800',
      event: 'bg-blue-100 text-blue-800',
      beatbloom: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={typeColors[type] || typeColors.general}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enquiry Management</h2>
          <p className="text-gray-600 mt-1">Manage and respond to customer enquiries</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">New</div>
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus.new}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Read</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.read}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Replied</div>
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.replied}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Closed</div>
            <div className="text-2xl font-bold text-gray-600">{stats.byStatus.closed}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="venue">Venue</option>
            <option value="package">Package</option>
            <option value="event">Event</option>
            <option value="beatbloom">Beat & Bloom</option>
            <option value="general">General</option>
          </select>
          <Button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('');
              setSelectedType('');
            }}
            variant="outline"
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Enquiries Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No enquiries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <div className="text-sm font-medium text-gray-900">{enquiry.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enquiry.email}</div>
                      {enquiry.phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {enquiry.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(enquiry.enquiryType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{enquiry.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(enquiry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleViewEnquiry(enquiry._id)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {enquiry.status !== 'replied' && enquiry.status !== 'closed' && (
                          <Button
                            onClick={() => {
                              setSelectedEnquiry(enquiry);
                              setShowResponseModal(true);
                            }}
                            size="sm"
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Enquiry Details</h3>
                <Button
                  onClick={() => {
                    setSelectedEnquiry(null);
                    setShowResponseModal(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedEnquiry.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedEnquiry.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedEnquiry.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <div className="mt-1">{getTypeBadge(selectedEnquiry.enquiryType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedEnquiry.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(selectedEnquiry.createdAt)}</div>
                  </div>
                </div>

                {selectedEnquiry.relatedId && selectedEnquiry.relatedModel && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Related {selectedEnquiry.relatedModel}</label>
                    <div className="mt-1">
                      {selectedEnquiry.relatedModel === 'Venue' && selectedEnquiry.relatedId.name && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-pink-100 text-pink-800">Venue</Badge>
                          <span className="text-sm text-gray-900 font-medium">{selectedEnquiry.relatedId.name}</span>
                          {selectedEnquiry.relatedId.location && (
                            <span className="text-sm text-gray-500">({selectedEnquiry.relatedId.location})</span>
                          )}
                        </div>
                      )}
                      {selectedEnquiry.relatedModel === 'Package' && selectedEnquiry.relatedId.title && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800">Package</Badge>
                          <span className="text-sm text-gray-900 font-medium">{selectedEnquiry.relatedId.title}</span>
                        </div>
                      )}
                      {selectedEnquiry.relatedModel === 'Event' && selectedEnquiry.relatedId.name && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Event</Badge>
                          <span className="text-sm text-gray-900 font-medium">{selectedEnquiry.relatedId.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedEnquiry.subject}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedEnquiry.message}
                  </div>
                </div>

                {selectedEnquiry.eventDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Event Date</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(selectedEnquiry.eventDate)}</div>
                  </div>
                )}

                {selectedEnquiry.adminResponse && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Admin Response</label>
                    <div className="mt-1 p-3 bg-green-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedEnquiry.adminResponse}
                    </div>
                    {selectedEnquiry.respondedAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Responded on: {formatDate(selectedEnquiry.respondedAt)}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t">
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) => handleUpdateStatus(selectedEnquiry._id, e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  {selectedEnquiry.status !== 'replied' && selectedEnquiry.status !== 'closed' && (
                    <Button
                      onClick={() => setShowResponseModal(true)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Respond
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Respond to Enquiry</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your response..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRespond}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnquiryManagement;

