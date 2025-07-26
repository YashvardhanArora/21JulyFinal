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
  Edit,
  Paperclip,
  Download,
  ExternalLink
} from "lucide-react";
import { formatDate, getStatusColor, getPriorityColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Complaint, ComplaintPriority } from "@shared/schema";

interface ComplaintListProps {
  complaints: Complaint[];
  isLoading: boolean;
}

export function ComplaintList({ complaints, isLoading }: ComplaintListProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: ComplaintPriority }) => {
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
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

  return (
    <div className="space-y-4">
      {complaints.map((complaint) => (
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
                </div>

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
                {complaint.attachment && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">File Attached:</span>
                    <span className="text-sm text-blue-700">{complaint.attachment.split('_').pop()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment)}`, '_blank')}
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
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
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
        {complaint.attachment && (
          <div>
            <h3 className="font-semibold mb-3">Supporting Documents</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Paperclip className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Attached File</p>
                    <p className="text-sm text-blue-700">{complaint.attachment.split('_').pop()}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment)}`, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View File
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/download/${encodeURIComponent(complaint.attachment)}`, '_blank')}
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