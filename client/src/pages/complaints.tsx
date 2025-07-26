import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComplaintList } from "@/components/complaint-list";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Paperclip, Download, Eye } from "lucide-react";
import type { Complaint } from "@shared/schema";


export default function ComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: apiComplaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    refetchInterval: 30000,
  });

  // Use all complaints without year filtering
  const complaints = apiComplaints;

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchQuery || 
      complaint.depoPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.voc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.complaintType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.areaOfConcern?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Complaints</h1>
          <p className="text-gray-600">View and manage all customer complaints</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredComplaints.length} of {complaints.length} complaints
        </p>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length > 0 ? (
        <ComplaintList complaints={filteredComplaints} isLoading={isLoading} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No complaints found matching your criteria</p>
        </div>
      )}
    </div>
  );
}