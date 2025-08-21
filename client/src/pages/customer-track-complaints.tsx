import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Eye, FileText, Calendar, User, Phone, Mail, Clock, CheckCircle2, AlertCircle, XCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAsmAuth } from '@/hooks/use-asm-auth';
import { asmApiGet } from '@/lib/asm-api';


interface CustomerUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Complaint {
  id: number;
  complaintCode?: string;
  complaintType: string;
  status: string;
  priority: string;
  depoPartyName: string;
  productName: string;
  areaOfConcern: string;
  voiceOfCustomer: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from PHP version
  email: string;
  contactNumber: string;
  invoiceNo: string;
  invoiceDate: string;
  transporterName: string;
  lrNumber: string;
  placeOfSupply: string;
  salesPersonName: string;
  subCategory: string;
}

export default function CustomerTrackComplaints() {
  const [, setLocation] = useLocation();
  const { user } = useAsmAuth();
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Fetch user's complaints with real-time updates
  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ['/api/asm/my-complaints'],
    queryFn: () => asmApiGet<Complaint[]>('/api/asm/my-complaints'),
    enabled: !!user,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time feel
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000, // Consider data stale after 1 second
  });

  const handleComplaintSelect = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    const complaint = complaints?.find((c: Complaint) => c.id.toString() === complaintId);
    setSelectedComplaint(complaint || null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 25;
      case 'in-progress': return 50;
      case 'resolved': return 75;
      case 'closed': return 100;
      default: return 0;
    }
  };

  const StatusProgressBar = ({ status }: { status: string }) => {
    const progress = getProgressPercentage(status);
    const statusSteps = [
      { name: 'New', value: 'new' },
      { name: 'In Progress', value: 'in-progress' },
      { name: 'Resolved', value: 'resolved' },
      { name: 'Closed', value: 'closed' }
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {statusSteps.map((step, index) => (
            <div key={step.value} className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-1 ${
                status.toLowerCase() === step.value 
                  ? 'bg-blue-600' 
                  : progress > (index * 25) 
                    ? 'bg-green-600' 
                    : 'bg-gray-300'
              }`} />
              <span className={status.toLowerCase() === step.value ? 'font-medium text-blue-600' : ''}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/asm/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Track Your Complaints
              </h1>
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Complaint Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Select Complaint to Track
              </CardTitle>
              <CardDescription>
                Choose a complaint from your submitted complaints to view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading your complaints...</p>
              ) : complaints && complaints.length > 0 ? (
                <div className="space-y-4">
                  <Select onValueChange={handleComplaintSelect} value={selectedComplaintId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a complaint to track" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaints.map((complaint: Complaint) => (
                        <SelectItem key={complaint.id} value={complaint.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {complaint.complaintCode || `#${complaint.id}`} - {complaint.complaintType}
                            </span>
                            <Badge className={`ml-2 ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Complaint List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {complaints.map((complaint: Complaint) => (
                      <div 
                        key={complaint.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedComplaintId === complaint.id.toString() ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleComplaintSelect(complaint.id.toString())}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(complaint.status)}
                            <h4 className="font-medium text-gray-900">
                              {complaint.complaintCode || `Complaint #${complaint.id}`}
                            </h4>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-100 h-7 px-2 py-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/asm/complaints/edit/${complaint.id}`);
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status}
                            </Badge>
                            <Badge className={`${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Type:</strong> {complaint.complaintType}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Product:</strong> {complaint.productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          <strong>Created:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't submitted any complaints yet. Submit your first complaint to start tracking its progress.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => setLocation('/asm/new-complaint')}
                    >
                      Submit Your First Complaint
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => refetch()}
                    >
                      Refresh Complaints
                    </Button>
                  </div>
                  
                  {/* Sample tracking information */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
                    <h4 className="font-medium text-blue-900 mb-2">How Complaint Tracking Works:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Submit a complaint through the form</li>
                      <li>• Receive a unique complaint ID</li>
                      <li>• Track status updates in real-time</li>
                      <li>• Get notified when status changes</li>
                      <li>• View complete complaint history</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Complaint Details
              </CardTitle>
              <CardDescription>
                Detailed information about the selected complaint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedComplaint ? (
                <div className="space-y-6">
                  {/* Status & Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedComplaint.status)}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Current Status</label>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={`${getStatusColor(selectedComplaint.status)}`}>
                            {selectedComplaint.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(selectedComplaint.priority)}`}>
                            {selectedComplaint.priority} Priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <StatusProgressBar status={selectedComplaint.status} />
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>ID:</strong> {selectedComplaint.complaintCode || `#${selectedComplaint.id}`}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Type:</strong> {selectedComplaint.complaintType}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Created:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Last Updated:</strong> {new Date(selectedComplaint.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Party Name:</strong> {selectedComplaint.depoPartyName}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Email:</strong> {selectedComplaint.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm"><strong>Contact:</strong> {selectedComplaint.contactNumber}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Product Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Product & Complaint Details</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm"><strong>Product Name:</strong> {selectedComplaint.productName}</span>
                      </div>
                      <div>
                        <span className="text-sm"><strong>Area of Concern:</strong> {selectedComplaint.areaOfConcern}</span>
                      </div>
                      {selectedComplaint.subCategory && (
                        <div>
                          <span className="text-sm"><strong>Sub Category:</strong> {selectedComplaint.subCategory}</span>
                        </div>
                      )}
                      {selectedComplaint.placeOfSupply && (
                        <div>
                          <span className="text-sm"><strong>Place of Supply:</strong> {selectedComplaint.placeOfSupply}</span>
                        </div>
                      )}
                      {selectedComplaint.salesPersonName && (
                        <div>
                          <span className="text-sm"><strong>Salesperson:</strong> {selectedComplaint.salesPersonName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  {(selectedComplaint.invoiceNo || selectedComplaint.transporterName) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Invoice & Transport Details</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedComplaint.invoiceNo && (
                            <div>
                              <span className="text-sm"><strong>Invoice No:</strong> {selectedComplaint.invoiceNo}</span>
                            </div>
                          )}
                          {selectedComplaint.invoiceDate && (
                            <div>
                              <span className="text-sm"><strong>Invoice Date:</strong> {new Date(selectedComplaint.invoiceDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {selectedComplaint.transporterName && (
                            <div>
                              <span className="text-sm"><strong>Transporter:</strong> {selectedComplaint.transporterName}</span>
                            </div>
                          )}
                          {selectedComplaint.lrNumber && (
                            <div>
                              <span className="text-sm"><strong>LR Number:</strong> {selectedComplaint.lrNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Description */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Complaint Description</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedComplaint.voiceOfCustomer}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint Details</h3>
                  <p className="text-gray-600 mb-6">Select a complaint from the left panel to view detailed information</p>
                  
                  {/* Information about what details will be shown */}
                  <div className="text-left bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">What you'll see here:</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Current complaint status and priority
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Complete contact and party information
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Product details and area of concern
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Invoice and transportation details
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Full complaint description
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Timeline of status updates
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}