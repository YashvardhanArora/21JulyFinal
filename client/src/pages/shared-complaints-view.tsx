import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building, 
  MapPin, 
  Package, 
  Clock, 
  Eye, 
  Search, 
  Filter,
  ExternalLink,
  Download,
  Paperclip,
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  User,
  FileText,
  Truck,
  Package2
} from 'lucide-react';
import { formatDate, getStatusColor, getPriorityColor, hasValidAttachment } from '@/lib/utils';
import logoPath from '@assets/logo_1752043363523.png';
import { useState } from 'react';
import type { Complaint } from '@shared/schema';

export default function SharedComplaintsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Fetch complaints data
  const { data: complaints = [], isLoading, refetch } = useQuery<Complaint[]>({
    queryKey: ['/api/complaints'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Filter complaints based on year, search, status, and priority
  const filteredComplaints = complaints.filter(complaint => {
    const complaintYear = complaint.date ? new Date(complaint.date).getFullYear().toString() : '2025';
    const yearMatch = selectedYear === 'all' || complaintYear === selectedYear;
    
    const searchMatch = !searchQuery || 
      Object.values(complaint).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const statusMatch = statusFilter === 'all' || complaint.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return yearMatch && searchMatch && statusMatch && priorityMatch;
  });

  // Calculate status statistics based on filtered complaints
  const statusStats = filteredComplaints.reduce((acc, complaint) => {
    const status = complaint.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalComplaints = filteredComplaints.length;
  const openComplaints = (statusStats['new'] || 0) + (statusStats['in progress'] || 0);
  const resolvedComplaints = statusStats['resolved'] || 0;
  const closedComplaints = statusStats['closed'] || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={logoPath} 
                alt="BN Group Logo" 
                className="h-12 w-auto" 
                loading="eager" 
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BN Support Desk</h1>
                <p className="text-sm text-gray-600">Shared Complaints Dashboard</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComplaints}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{openComplaints}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{resolvedComplaints}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{closedComplaints}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedYear("2024")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedYear === "2024"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    2024
                  </button>
                  <button
                    onClick={() => setSelectedYear("2025")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedYear === "2025"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    2025
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Complaints ({filteredComplaints.length})</span>
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No complaints found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint, index) => (
                  <Card key={complaint.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">
                            S.no. {index + 1}
                          </span>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {complaint.complaintType}
                          </h4>
                          {complaint.depoPartyName && complaint.depoPartyName !== '-' && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="w-4 h-4 mr-1" />
                              {complaint.depoPartyName}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {complaint.placeOfSupply && complaint.placeOfSupply !== '-' && (
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {complaint.placeOfSupply}
                            </div>
                          )}
                          {complaint.productName && complaint.productName !== '-' && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Package className="w-4 h-4 mr-1" />
                              {complaint.productName}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {complaint.areaOfConcern && complaint.areaOfConcern !== '-' && (
                            <div className="text-sm text-gray-600 mb-1">
                              <strong>Area:</strong> {complaint.areaOfConcern}
                            </div>
                          )}
                          {hasValidAttachment(complaint.attachment) && (
                            <div className="flex items-center text-sm text-blue-600">
                              <Paperclip className="w-4 h-4 mr-1" />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800 h-auto p-0"
                              >
                                View File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {complaint.voc && complaint.voc !== '-' && (
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            <strong>Voice of Customer:</strong> {complaint.voc}
                          </p>
                        </div>
                      )}

                      {/* View Details Button */}
                      <div className="flex justify-end pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Complaint Details - S.no. {index + 1}
                              </DialogTitle>
                              <DialogDescription>
                                Complete information for complaint from {complaint.depoPartyName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Basic Information</h3>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Building className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Depo/Party:</span>
                                      <span className="text-sm">{complaint.depoPartyName || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Package2 className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Product:</span>
                                      <span className="text-sm">{complaint.productName || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Complaint Type:</span>
                                      <span className="text-sm">{complaint.complaintType || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Location:</span>
                                      <span className="text-sm">{complaint.placeOfSupply || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Date:</span>
                                      <span className="text-sm">{complaint.date ? formatDate(complaint.date) : '-'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Contact Information</h3>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Email:</span>
                                      <span className="text-sm">{complaint.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Contact:</span>
                                      <span className="text-sm">{complaint.contactNumber || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Sales Person:</span>
                                      <span className="text-sm">{complaint.salePersonName || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Details */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Additional Details</h3>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Invoice Number:</span>
                                      <span className="text-sm">{complaint.invoiceNo || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Invoice Date:</span>
                                      <span className="text-sm">{complaint.invoiceDate ? formatDate(complaint.invoiceDate) : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">LR Number:</span>
                                      <span className="text-sm">{complaint.lrNumber || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Transporter:</span>
                                      <span className="text-sm">{complaint.transporterName || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Transporter Contact:</span>
                                      <span className="text-sm">{complaint.transporterNumber || '-'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Priority */}
                                <div>
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Status & Priority</h3>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Status:</span>
                                      <Badge className={getStatusColor(complaint.status)}>
                                        {complaint.status || 'New'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium">Priority:</span>
                                      <Badge className={getPriorityColor(complaint.priority || 'medium')}>
                                        {complaint.priority || 'Medium'}
                                      </Badge>
                                    </div>
                                    {complaint.dateOfResolution && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Resolution Date:</span>
                                        <span className="text-sm">{formatDate(complaint.dateOfResolution)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Voice of Customer */}
                              {complaint.voc && complaint.voc !== '-' && (
                                <div className="col-span-full">
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Voice of Customer</h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700">{complaint.voc}</p>
                                  </div>
                                </div>
                              )}

                              {/* Attachments */}
                              {hasValidAttachment(complaint.attachment) && (
                                <div className="col-span-full">
                                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Attachments</h3>
                                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                    <Paperclip className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">Attachment available</span>
                                    <Button 
                                      variant="link" 
                                      size="sm" 
                                      className="text-blue-600 p-0 h-auto"
                                      onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}