import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ComplaintCard } from "./complaint-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Complaint, ComplaintStatus } from "@shared/schema";

interface KanbanBoardProps {
  complaints: (Complaint & { createdByUser?: { firstName?: string; lastName?: string; email?: string; username?: string } })[];
  isLoading: boolean;
}

const COLUMNS = [
  { id: "open", title: "Open", color: "red" },
  { id: "resolved", title: "Resolved", color: "green" },
  { id: "closed", title: "Closed", color: "gray" },
] as const;

export function KanbanBoard({ complaints, isLoading }: KanbanBoardProps) {
  const [draggedComplaint, setDraggedComplaint] = useState<Complaint | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ComplaintStatus }) => {
      const adminToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      
      if (adminToken) {
        headers['admin-authorization'] = adminToken;
      }
      
      const response = await apiRequest(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers,
      });
      return response.json();
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/complaints"] });
      await queryClient.cancelQueries({ queryKey: ["/api/complaints/stats"] });
      
      // Snapshot the previous value
      const previousComplaints = queryClient.getQueryData(["/api/complaints"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/complaints"], (old: any) => {
        if (!old) return old;
        return old.map((complaint: any) => 
          complaint.id === variables.id 
            ? { ...complaint, status: variables.status, updatedAt: new Date().toISOString() }
            : complaint
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousComplaints };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousComplaints) {
        queryClient.setQueryData(["/api/complaints"], context.previousComplaints);
      }
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Update the cache with the actual server response
      queryClient.setQueryData(["/api/complaints"], (old: any) => {
        if (!old) return old;
        return old.map((complaint: any) => 
          complaint.id === variables.id 
            ? data
            : complaint
        );
      });
      
      // Refetch stats to get updated counts
      queryClient.invalidateQueries({ 
        queryKey: ["/api/complaints/stats"],
        refetchType: 'active'
      });
      
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ["/api/complaints"],
        refetchType: 'active'
      });
    },
  });

  const handleDragStart = (complaint: Complaint) => {
    setDraggedComplaint(complaint);
  };

  const handleDragEnd = () => {
    setDraggedComplaint(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: ComplaintStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedComplaint && draggedComplaint.status !== newStatus) {
      updateComplaintMutation.mutate({
        id: draggedComplaint.id,
        status: newStatus,
      });
    }
    setDraggedComplaint(null);
  };

  const getComplaintsByStatus = (status: string) => {
    return complaints.filter(complaint => complaint.status === status);
  };

  const getStatusCounts = () => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.id] = getComplaintsByStatus(column.id).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-8" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {COLUMNS.map((column) => {
        const columnComplaints = getComplaintsByStatus(column.id);
        const isDragOver = dragOverColumn === column.id;

        return (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <span className={`w-3 h-3 bg-${column.color}-500 rounded-full mr-2`}></span>
                {column.title}
              </h4>
              <span className={`bg-${column.color}-100 text-${column.color}-800 text-xs px-2 py-1 rounded-full`}>
                {statusCounts[column.id] || 0}
              </span>
            </div>
            
            <div
              className={`
                border-2 border-dashed border-gray-300 rounded-lg transition-colors
                drag-drop-zone overflow-hidden flex flex-col
                ${isDragOver ? "drag-over border-blue-400 bg-blue-50" : ""}
              `}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id as ComplaintStatus)}
              style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {columnComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onDragStart={() => handleDragStart(complaint)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedComplaint?.id === complaint.id}
                  />
                ))}
                
                {columnComplaints.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No complaints in this status</p>
                    <p className="text-xs mt-1">Drag complaints here to update status</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
