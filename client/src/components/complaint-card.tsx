import { useState } from "react";
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
import { Building, MapPin, Package, Phone, Mail, FileText, User, Truck, Paperclip, ExternalLink, Download, MessageCircle } from "lucide-react";
import { formatRelativeTime, getPriorityColor, formatDate, hasValidAttachment } from "@/lib/utils";
import { ComplaintComments } from "./complaint-comments";
import type { Complaint } from "@shared/schema";

interface ComplaintCardProps {
  complaint: Complaint & { createdByUser?: { firstName?: string; lastName?: string; email?: string; username?: string } };
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function ComplaintCard({ complaint, onDragStart, onDragEnd, isDragging }: ComplaintCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', complaint.id.toString());
    onDragStart();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd();
  };

  return (
    <Card
      className={`
        complaint-card cursor-move shadow-sm border border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200
        ${isDragging ? "opacity-50 scale-95 dragging" : ""}
      `}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">#{complaint.yearlySequenceNumber || complaint.id}</span>
            <Badge className={getPriorityColor(complaint.priority)}>
              {complaint.priority}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(complaint.createdAt)}
          </span>
        </div>
        
        <h5 className="font-medium text-gray-900 mb-2 line-clamp-1">
          {complaint.complaintType}: {complaint.areaOfConcern && complaint.areaOfConcern !== '-' ? complaint.areaOfConcern : 'General Issue'}
        </h5>
        
        {/* Show who raised the complaint */}
        {complaint.createdByUser && (
          <div className="bg-amber-50 p-2 rounded mb-2">
            <div className="flex items-center text-xs text-amber-800">
              <User className="w-3 h-3 mr-1" />
              <span className="truncate">
                Raised by: {complaint.createdByUser.firstName} {complaint.createdByUser.lastName}
                {complaint.createdByUser.email && ` (${complaint.createdByUser.email})`}
              </span>
            </div>
          </div>
        )}
        
        {/* Always show depot name prominently if available */}
        {complaint.depoPartyName && complaint.depoPartyName !== '-' && (
          <div className="bg-blue-50 p-2 rounded mb-2">
            <div className="flex items-center text-sm font-medium text-blue-800">
              <Building className="w-4 h-4 mr-2" />
              <span className="truncate">{complaint.depoPartyName}</span>
            </div>
          </div>
        )}
        
        {complaint.voc && complaint.voc !== '-' && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {complaint.voc}
          </p>
        )}
        
        <div className="space-y-2">
          {(() => {
            // Collect available details (non-"-" fields) and show up to 3
            const availableDetails: JSX.Element[] = [];
            
            // Priority order of details to show
            const detailFields = [
              { field: complaint.placeOfSupply, icon: MapPin, label: 'Location' },
              { field: complaint.productName, icon: Package, label: 'Product' },
              { field: complaint.contactNumber, icon: Phone, label: 'Contact' },
              { field: complaint.email, icon: Mail, label: 'Email' },
              { field: complaint.invoiceNo, icon: FileText, label: 'Invoice' },
              { field: complaint.salePersonName, icon: User, label: 'Sales Person' },
              { field: complaint.transporterName, icon: Truck, label: 'Transporter' }
            ];
            
            // Filter available fields and take first 3
            detailFields.forEach(({ field, icon: Icon, label }) => {
              if (field && field !== '-' && availableDetails.length < 3) {
                availableDetails.push(
                  <div key={label} className="flex items-center text-xs text-gray-600">
                    <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{field}</span>
                  </div>
                );
              }
            });
            
            return availableDetails;
          })()}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex-1">
            {complaint.complaintSource && complaint.complaintSource !== '-' && (
              <Badge variant="outline" className="text-xs">
                {complaint.complaintSource}
              </Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadComplaintDetails(complaint);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Download complaint details as text file"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
  
  return 1; // Default to admin ID
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

function ComplaintDetailDialog({ complaint }: { complaint: Complaint }) {
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Complaint Details - #{complaint.yearlySequenceNumber || complaint.id}</span>
          <div className="flex space-x-2">
            <Badge className={getPriorityColor(complaint.priority)}>
              {complaint.priority}
            </Badge>
          </div>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Basic Information</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Type:</strong> {complaint.complaintType}</div>
              {complaint.complaintSource && complaint.complaintSource !== '-' && (
                <div><strong>Source:</strong> {complaint.complaintSource}</div>
              )}
              {complaint.areaOfConcern && complaint.areaOfConcern !== '-' && (
                <div><strong>Area of Concern:</strong> {complaint.areaOfConcern}</div>
              )}
              <div><strong>Status:</strong> {complaint.status}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Location & Party</h4>
            <div className="space-y-1 text-sm">
              {complaint.placeOfSupply && complaint.placeOfSupply !== '-' && (
                <div><strong>Place of Supply:</strong> {complaint.placeOfSupply}</div>
              )}
              {complaint.depoPartyName && complaint.depoPartyName !== '-' && (
                <div><strong>Party Name:</strong> {complaint.depoPartyName}</div>
              )}
              {complaint.contactNumber && complaint.contactNumber !== '-' && (
                <div><strong>Contact:</strong> {complaint.contactNumber}</div>
              )}
              {complaint.email && complaint.email !== '-' && (
                <div><strong>Email:</strong> {complaint.email}</div>
              )}
            </div>
          </div>
        </div>

        {complaint.voc && complaint.voc !== '-' && (
          <div>
            <h4 className="font-medium mb-2">Voice of Customer</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              {complaint.voc}
            </div>
          </div>
        )}

        {/* File Attachment Section */}
        {hasValidAttachment(complaint.attachment) && (
          <div>
            <h4 className="font-medium mb-2">Supporting Documents</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Paperclip className="w-4 h-4 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 text-sm">Attached File</p>
                    <p className="text-xs text-blue-700 mb-2">{complaint.attachment?.split('_').pop()}</p>
                    
                    {/* Image Preview */}
                    {complaint.attachment && (complaint.attachment.endsWith('.jpg') || complaint.attachment.endsWith('.jpeg') || complaint.attachment.endsWith('.png')) && (
                      <div className="mt-2">
                        <img 
                          src={`/api/files/${encodeURIComponent(complaint.attachment)}`}
                          alt="Attachment Preview" 
                          className="max-w-full max-h-32 object-contain rounded border border-gray-200 bg-white shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1 h-6"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/download/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1 h-6"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Get
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Product Information</h4>
            <div className="space-y-1 text-sm">
              {complaint.productName && complaint.productName !== '-' && (
                <div><strong>Product:</strong> {complaint.productName}</div>
              )}
              {complaint.invoiceNo && complaint.invoiceNo !== '-' && (
                <div><strong>Invoice No:</strong> {complaint.invoiceNo}</div>
              )}
              {complaint.invoiceDate && complaint.invoiceDate !== '-' && (
                <div><strong>Invoice Date:</strong> {complaint.invoiceDate}</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Resolution</h4>
            <div className="space-y-1 text-sm">
              {complaint.personResponsible && complaint.personResponsible !== '-' && (
                <div><strong>Person Responsible:</strong> {complaint.personResponsible}</div>
              )}
              <div><strong>Created:</strong> {formatDate(complaint.createdAt)}</div>
              <div><strong>Updated:</strong> {formatDate(complaint.updatedAt)}</div>
            </div>
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
