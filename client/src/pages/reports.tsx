import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Calendar as CalendarIcon, BarChart, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useYear } from "@/contexts/year-context";
import type { Complaint } from "@shared/schema";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { selectedYear } = useYear();
  const { toast } = useToast();

  const { data: apiComplaints = [] } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  // Use all complaints regardless of year for date filtering
  const complaints = apiComplaints;

  // Removed analytics report function as requested - only keeping All Complaints Report

  const exportAllComplaintsReport = async () => {
    try {
      if (!startDate || !endDate) {
        toast({
          title: "Date Selection Required",
          description: "Please select both start and end dates for the complaints report.",
          variant: "destructive",
        });
        return;
      }

      // Filter all complaints within date range
      const filteredComplaints = complaints.filter(complaint => {
        const creationDate = complaint.complaintCreation 
          ? new Date(complaint.complaintCreation) 
          : new Date(complaint.createdAt);
        
        return creationDate >= startDate && creationDate <= endDate;
      });

      // Use template-based export with date filtering
      const response = await fetch("/api/complaints/export-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          year: "all",
          complaints: filteredComplaints
        }),
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-complaints-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "All Complaints Report Downloaded",
        description: `Found ${filteredComplaints.length} complaints in the selected date range.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export complaints report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download complaint reports with date filtering</p>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Complaints Report - Only Report Available */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            All Complaints Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Download complete complaints report showing all complaints created within the selected date range. 
            Uses your original Excel template with all formatting, colors, and dropdowns preserved.
          </p>
          <Button 
            onClick={exportAllComplaintsReport}
            className="w-full"
            disabled={!startDate || !endDate}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Complaints Report
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{complaints.length}</div>
              <div className="text-sm text-gray-600">Total Complaints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {complaints.filter(c => c.status === "resolved").length}
              </div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {complaints.filter(c => c.status === "open").length}
              </div>
              <div className="text-sm text-gray-600">Open</div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}