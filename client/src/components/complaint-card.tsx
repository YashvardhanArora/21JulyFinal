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
import { Building, MapPin, Package, Eye } from "lucide-react";
import { formatRelativeTime, getPriorityColor, formatDate } from "@/lib/utils";
import type { Complaint } from "@shared/schema";

interface ComplaintCardProps {
  complaint: Complaint;
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
        ${isDragging ? "opacity-50 scale-95" : ""}
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
          {complaint.complaintType}: {complaint.areaOfConcern || 'General Issue'}
        </h5>
        
        {complaint.voc && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {complaint.voc}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <Building className="w-3 h-3 mr-1" />
            <span className="truncate">{complaint.depoPartyName}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{complaint.placeOfSupply}</span>
          </div>
          
          {complaint.productName && (
            <div className="flex items-center text-xs text-gray-600">
              <Package className="w-3 h-3 mr-1" />
              <span className="truncate">{complaint.productName}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {complaint.complaintSource}
          </Badge>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <ComplaintDetailDialog complaint={complaint} />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
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
              <div><strong>Source:</strong> {complaint.complaintSource}</div>
              <div><strong>Area of Concern:</strong> {complaint.areaOfConcern || 'N/A'}</div>
              <div><strong>Status:</strong> {complaint.status}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Location & Party</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Place of Supply:</strong> {complaint.placeOfSupply}</div>
              <div><strong>Party Name:</strong> {complaint.depoPartyName}</div>
              <div><strong>Contact:</strong> {complaint.contactNumber || 'N/A'}</div>
              <div><strong>Email:</strong> {complaint.email || 'N/A'}</div>
            </div>
          </div>
        </div>

        {complaint.voc && (
          <div>
            <h4 className="font-medium mb-2">Voice of Customer</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              {complaint.voc}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Product Information</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Product:</strong> {complaint.productName || 'N/A'}</div>
              <div><strong>Invoice No:</strong> {complaint.invoiceNo || 'N/A'}</div>
              <div><strong>Invoice Date:</strong> {complaint.invoiceDate || 'N/A'}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Resolution</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Person Responsible:</strong> {complaint.personResponsible || 'N/A'}</div>
              <div><strong>Created:</strong> {formatDate(complaint.createdAt)}</div>
              <div><strong>Updated:</strong> {formatDate(complaint.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
