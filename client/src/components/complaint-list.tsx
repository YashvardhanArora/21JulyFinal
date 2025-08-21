import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  Package, 
  AlertCircle,
  Paperclip,
  Download,
  ExternalLink,
  Trash2,
  MessageCircle,
  User
} from "lucide-react";
import { formatDate, getStatusColor, getPriorityColor, hasValidAttachment } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Complaint, ComplaintPriority } from "@shared/schema";
import { ComplaintComments } from "./complaint-comments";


interface ComplaintListProps {
  complaints: (Complaint & { createdByUser?: { firstName?: string; lastName?: string; email?: string; username?: string } })[];
  isLoading: boolean;
}

export function ComplaintList({ complaints, isLoading }: ComplaintListProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: ComplaintPriority }) => {
      const adminToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      
      if (adminToken) {
        headers['admin-authorization'] = adminToken;
      }
      
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
        headers,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/stats"] });
      toast({
        title: "Priority Updated",
        description: `Complaint #${variables.id} priority changed to ${variables.priority}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    },
  });

  const handlePriorityChange = (complaintId: number, newPriority: ComplaintPriority) => {
    updatePriorityMutation.mutate({ id: complaintId, priority: newPriority });
  };

  const deleteComplaintMutation = useMutation({
    mutationFn: async (id: number) => {
      const adminToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      
      if (adminToken) {
        headers['admin-authorization'] = adminToken;
      }
      
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "DELETE",
        headers,
      });
      
      // Handle 204 No Content response (successful deletion)
      if (response.status === 204) {
        return { success: true, id };
      }
      
      // Try to parse JSON for other responses
      try {
        return await response.json();
      } catch {
        return { success: true, id }; // Assume success if no JSON body
      }
    },
    onSuccess: (data, complaintId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/stats"] });
      toast({
        title: "Complaint Deleted",
        description: `Complaint #${complaintId} has been permanently deleted`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete complaint",
        variant: "destructive",
      });
    },
  });

  const handleDeleteComplaint = (complaintId: number) => {
    deleteComplaintMutation.mutate(complaintId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Sort complaints in descending order (newest first)
  const sortedComplaints = [...complaints].sort((a, b) => {
    // First sort by yearly sequence number (descending - higher numbers first)
    if (a.yearlySequenceNumber && b.yearlySequenceNumber) {
      return b.yearlySequenceNumber - a.yearlySequenceNumber;
    }
    
    // If no sequence number, sort by creation date (newest first)
    const dateA = a.complaintCreation ? new Date(a.complaintCreation) : new Date(a.createdAt);
    const dateB = b.complaintCreation ? new Date(b.complaintCreation) : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      {sortedComplaints.map((complaint) => (
        <Card key={complaint.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">
                      #{complaint.yearlySequenceNumber || complaint.id}
                    </span>
                    <Badge variant="outline" className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                    <Select
                      value={complaint.priority}
                      onValueChange={(value) => handlePriorityChange(complaint.id, value as ComplaintPriority)}
                      disabled={updatePriorityMutation.isPending}
                    >
                      <SelectTrigger className={`w-[80px] h-7 ${getPriorityColor(complaint.priority)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <ComplaintDetailDialog complaint={complaint} />
                    </Dialog>


                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {getUserRole() === 'admin' ? 'Respond' : 'Chat'}
                        </Button>
                      </DialogTrigger>
                      <ComplaintChatDialog complaint={complaint} />
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => downloadComplaintDetails(complaint)}
                      title="Download complaint details as text file"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={deleteComplaintMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete this complaint? This action cannot be undone and will remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComplaint(complaint.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Raised by information */}
                {complaint.createdByUser && (
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <div className="flex items-center text-sm text-amber-800">
                      <User className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        Raised by: {complaint.createdByUser.firstName} {complaint.createdByUser.lastName}
                        {complaint.createdByUser.email && ` (${complaint.createdByUser.email})`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{complaint.depoPartyName}</div>
                      <div className="text-sm text-gray-500">{complaint.complaintSource}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{complaint.placeOfSupply}</div>
                      <div className="text-sm text-gray-500">Supply Location</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{complaint.productName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{complaint.complaintType}</div>
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">Area of Concern:</span>
                    <span className="text-sm">{complaint.areaOfConcern || 'Not specified'}</span>
                  </div>
                  
                  {complaint.voc && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <strong>Voice of Customer:</strong> {complaint.voc}
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                {hasValidAttachment(complaint.attachment) && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">File Attached:</span>
                    <span className="text-sm text-blue-700">{complaint.attachment?.split('_').pop()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}

                {/* Contact Info and Dates */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {complaint.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{complaint.email}</span>
                      </div>
                    )}
                    {complaint.contactNumber && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{complaint.contactNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span>Created: {formatDate(complaint.createdAt)}</span>
                    {complaint.personResponsible && (
                      <span>Assigned: {complaint.personResponsible}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ComplaintDetailDialog({ complaint }: { complaint: Complaint }) {
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(complaint.priority as ComplaintPriority);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: ComplaintPriority }) => {
      const adminToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      
      if (adminToken) {
        headers['admin-authorization'] = adminToken;
      }
      
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
        headers,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/stats"] });
      toast({
        title: "Priority Updated",
        description: `Complaint #${complaint.yearlySequenceNumber || complaint.id} priority changed to ${selectedPriority}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
      setSelectedPriority(complaint.priority as ComplaintPriority); // Reset on error
    },
  });

  const handlePriorityChange = (newPriority: string) => {
    const priority = newPriority as ComplaintPriority;
    setSelectedPriority(priority);
    updatePriorityMutation.mutate({ id: complaint.id, priority });
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Complaint Details - #{complaint.yearlySequenceNumber || complaint.id}</span>
          <div className="flex space-x-2 items-center">
            <Badge className={getStatusColor(complaint.status)}>
              {complaint.status}
            </Badge>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Priority:</span>
              <Select
                value={selectedPriority}
                onValueChange={handlePriorityChange}
                disabled={updatePriorityMutation.isPending}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-3">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Complaint Source:</strong> {complaint.complaintSource}</div>
              <div><strong>Place of Supply:</strong> {complaint.placeOfSupply}</div>
              <div><strong>Receiving Location:</strong> {complaint.complaintReceivingLocation}</div>
              <div><strong>Date:</strong> {complaint.date || 'N/A'}</div>
              <div><strong>Complaint Type:</strong> {complaint.complaintType}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Party Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Depo/Party Name:</strong> {complaint.depoPartyName}</div>
              <div><strong>Email:</strong> {complaint.email || 'N/A'}</div>
              <div><strong>Contact Number:</strong> {complaint.contactNumber || 'N/A'}</div>
              <div><strong>Sale Person:</strong> {complaint.salePersonName || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Invoice & Transport Details */}
        <div>
          <h3 className="font-semibold mb-3">Invoice & Transport Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Invoice No:</strong> {complaint.invoiceNo || 'N/A'}</div>
            <div><strong>Invoice Date:</strong> {complaint.invoiceDate || 'N/A'}</div>
            <div><strong>LR Number:</strong> {complaint.lrNumber || 'N/A'}</div>
            <div><strong>Transporter Name:</strong> {complaint.transporterName || 'N/A'}</div>
            <div><strong>Transporter Number:</strong> {complaint.transporterNumber || 'N/A'}</div>
          </div>
        </div>

        {/* Product & Complaint Details */}
        <div>
          <h3 className="font-semibold mb-3">Product & Complaint Details</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Product Name:</strong> {complaint.productName || 'N/A'}
            </div>
            <div className="text-sm">
              <strong>Area of Concern:</strong> {complaint.areaOfConcern || 'N/A'}
            </div>
            <div className="text-sm">
              <strong>Sub Category:</strong> {complaint.subCategory || 'N/A'}
            </div>
            {complaint.voc && (
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-sm">Voice of Customer:</strong>
                <p className="text-sm mt-1">{complaint.voc}</p>
              </div>
            )}
          </div>
        </div>

        {/* File Attachment Section */}
        {hasValidAttachment(complaint.attachment) && (
          <div>
            <h3 className="font-semibold mb-3">Supporting Documents</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Paperclip className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Attached File</p>
                    <p className="text-sm text-blue-700 mb-3">{complaint.attachment ? complaint.attachment.split('_').pop() : ''}</p>
                    
                    {/* Image Preview */}
                    {complaint.attachment && (complaint.attachment.endsWith('.jpg') || complaint.attachment.endsWith('.jpeg') || complaint.attachment.endsWith('.png')) && (
                      <div className="mt-3">
                        <img 
                          src={`/api/files/${encodeURIComponent(complaint.attachment)}`}
                          alt="Attachment Preview" 
                          className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-white shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => complaint.attachment && window.open(`/api/files/${encodeURIComponent(complaint.attachment)}`, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View File
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => complaint.attachment && window.open(`/api/download/${encodeURIComponent(complaint.attachment)}`, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Details */}
        <div>
          <h3 className="font-semibold mb-3">Resolution Details</h3>
          <div className="space-y-3">
            {complaint.actionTaken && (
              <div className="text-sm">
                <strong>Action Taken:</strong> {complaint.actionTaken}
              </div>
            )}
            {complaint.creditAmount && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Credit Amount:</strong> ₹{complaint.creditAmount}</div>
                <div><strong>Credit Date:</strong> {complaint.creditDate || 'N/A'}</div>
                <div><strong>Credit Note:</strong> {complaint.creditNoteNumber || 'N/A'}</div>
              </div>
            )}
            <div className="text-sm">
              <strong>Person Responsible:</strong> {complaint.personResponsible || 'N/A'}
            </div>
            {complaint.rootCauseActionPlan && (
              <div className="bg-blue-50 p-3 rounded-md">
                <strong className="text-sm">Root Cause / Action Plan:</strong>
                <p className="text-sm mt-1">{complaint.rootCauseActionPlan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status & Dates */}
        <div>
          <h3 className="font-semibold mb-3">Status & Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Final Status:</strong> {complaint.finalStatus || 'Open'}</div>
            <div><strong>Days to Resolve:</strong> {complaint.daysToResolve || 'N/A'}</div>
            <div><strong>Complaint Creation:</strong> {complaint.complaintCreation ? formatDate(complaint.complaintCreation) : formatDate(complaint.createdAt)}</div>
            <div><strong>Date of Resolution:</strong> {complaint.dateOfResolution ? formatDate(complaint.dateOfResolution) : 'N/A'}</div>
            <div><strong>Date of Closure:</strong> {complaint.dateOfClosure ? formatDate(complaint.dateOfClosure) : 'N/A'}</div>
            <div><strong>Last Updated:</strong> {formatDate(complaint.updatedAt)}</div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function ComplaintChatDialog({ complaint }: { complaint: Complaint }) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span>Chat: Complaint #{complaint.yearlySequenceNumber || complaint.id}</span>
          <Badge className={getPriorityColor(complaint.priority)}>
            {complaint.priority}
          </Badge>
        </DialogTitle>
        <div className="text-sm text-gray-600 mt-2">
          <strong>{complaint.complaintType}:</strong> {complaint.areaOfConcern && complaint.areaOfConcern !== '-' ? complaint.areaOfConcern : 'General Issue'}
          {complaint.depoPartyName && complaint.depoPartyName !== '-' && (
            <span className="ml-2">• <strong>Party:</strong> {complaint.depoPartyName}</span>
          )}
        </div>
      </DialogHeader>
      
      <div className="mt-4">
        <ComplaintComments
          complaintId={complaint.id}
          complaintStatus={complaint.status}
          currentUserRole={getUserRole()}
          currentUserId={getCurrentUserId()}
        />
      </div>
    </DialogContent>
  );
}

// Helper functions to get current user context
function getUserRole(): 'admin' | 'customer' {
  // Check if we're in admin context (admin token exists)
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) return 'admin';
  
  // Check if we're in ASM context (asm token exists)
  const asmToken = localStorage.getItem('asm_token');
  if (asmToken) return 'customer';
  
  // Default to admin if no tokens (shouldn't happen)
  return 'admin';
}

function getCurrentUserId(): number {
  const adminToken = localStorage.getItem('admin_token');
  const asmToken = localStorage.getItem('asm_token');
  
  if (adminToken) {
    try {
      const payload = JSON.parse(atob(adminToken.split('.')[1]));
      return payload.userId || 1;
    } catch {
      return 1; // Default admin ID
    }
  }
  
  if (asmToken) {
    try {
      const payload = JSON.parse(atob(asmToken.split('.')[1]));
      return payload.userId || 2;
    } catch {
      return 2; // Default ASM ID
    }
  }
  
  return 1; // Default to admin
}

// Function to download complaint details as text file
function downloadComplaintDetails(complaint: Complaint) {
  const formatValue = (value: any) => value && value !== '-' ? value : 'N/A';
  
  const content = `COMPLAINT DETAILS - #${complaint.yearlySequenceNumber || complaint.id}
=====================================

BASIC INFORMATION:
------------------
Complaint Type: ${formatValue(complaint.complaintType)}
Status: ${formatValue(complaint.status)}
Priority: ${formatValue(complaint.priority)}
Source: ${formatValue(complaint.complaintSource)}
Area of Concern: ${formatValue(complaint.areaOfConcern)}
Sub Category: ${formatValue(complaint.subCategory)}

LOCATION & PARTY DETAILS:
-------------------------
Place of Supply: ${formatValue(complaint.placeOfSupply)}
Party Name: ${formatValue(complaint.depoPartyName)}
Contact Number: ${formatValue(complaint.contactNumber)}
Email: ${formatValue(complaint.email)}

PRODUCT INFORMATION:
--------------------
Product Name: ${formatValue(complaint.productName)}
Invoice Number: ${formatValue(complaint.invoiceNo)}
Invoice Date: ${formatValue(complaint.invoiceDate)}
LR Number: ${formatValue(complaint.lrNumber)}

TRANSPORT DETAILS:
------------------
Transporter Name: ${formatValue(complaint.transporterName)}
Transporter Number: ${formatValue(complaint.transporterNumber)}

VOICE OF CUSTOMER:
------------------
${formatValue(complaint.voc)}

RESOLUTION DETAILS:
-------------------
Action Taken: ${formatValue(complaint.actionTaken)}
Person Responsible: ${formatValue(complaint.personResponsible)}
Root Cause/Action Plan: ${formatValue(complaint.rootCauseActionPlan)}

FINANCIAL DETAILS:
------------------
Credit Amount: ${formatValue(complaint.creditAmount)}
Credit Date: ${formatValue(complaint.creditDate)}
Credit Note Number: ${formatValue(complaint.creditNoteNumber)}

SALES INFORMATION:
------------------
Sales Person: ${formatValue(complaint.salePersonName)}

TIMELINE:
---------
Complaint Creation: ${formatValue(complaint.complaintCreation || complaint.createdAt)}
Date of Resolution: ${formatValue(complaint.dateOfResolution)}
Date of Closure: ${formatValue(complaint.dateOfClosure)}
Days to Resolve: ${formatValue(complaint.daysToResolve)}
Final Status: ${formatValue(complaint.finalStatus)}
Last Updated: ${formatValue(complaint.updatedAt)}

ATTACHMENT:
-----------
File: ${complaint.attachment && complaint.attachment !== '-' ? complaint.attachment.split('_').pop() : 'No attachment'}

=====================================
Generated on: ${new Date().toLocaleString()}
`;

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Complaint_${complaint.yearlySequenceNumber || complaint.id}_Details.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}