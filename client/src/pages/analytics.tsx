import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Charts } from "@/components/charts";
import { StatsCards } from "@/components/stats-cards";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Complaint } from "@shared/schema";

import { 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useState } from "react";



export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: apiStats } = useQuery({
    queryKey: ["/api/complaints/stats"],
  });

  const { data: apiComplaints = [] } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  // Use all complaints without year filtering
  const complaints = apiComplaints;

  // Calculate stats based on filtered complaints data
  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === "new").length,
    inProgress: complaints.filter(c => c.status === "in-progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
    resolvedToday: complaints.filter(c => {
      const today = new Date();
      const resolvedDate = c.dateOfResolution ? new Date(c.dateOfResolution) : null;
      return resolvedDate && 
        resolvedDate.toDateString() === today.toDateString() &&
        (c.status === "resolved" || c.status === "closed");
    }).length
  };

  const { data: trends } = useQuery({
    queryKey: [`/api/complaints/trends/${parseInt(timeRange)}`],
  });

  // Analytics calculations
  const productData = complaints.reduce((acc, complaint) => {
    const product = complaint.productName || 'Other';
    const existing = acc.find(item => item.name === product);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: product, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const priorityData = complaints.reduce((acc, complaint) => {
    acc[complaint.priority] = (acc[complaint.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityChartData = Object.entries(priorityData).map(([priority, count]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count
  }));

  // Calculate actual resolution times from real data
  const resolutionTimeData = (() => {
    const completedComplaints = complaints.filter(c => 
      (c.status === "resolved" || c.status === "closed") && c.createdAt
    );

    if (completedComplaints.length === 0) {
      return []; // Return empty array if no completed complaints
    }

    const timeRanges = {
      "< 1 hour": 0,
      "1-4 hours": 0,
      "4-24 hours": 0,
      "1-3 days": 0,
      "> 3 days": 0
    };

    completedComplaints.forEach(complaint => {
      const createdAt = new Date(complaint.createdAt);
      // Use dateOfResolution if available, otherwise use dateOfClosure, otherwise use updatedAt
      const completionDate = complaint.dateOfResolution || complaint.dateOfClosure || complaint.updatedAt;
      const completedAt = new Date(completionDate);
      const timeDiffMs = completedAt.getTime() - createdAt.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      if (timeDiffHours < 1) {
        timeRanges["< 1 hour"]++;
      } else if (timeDiffHours < 4) {
        timeRanges["1-4 hours"]++;
      } else if (timeDiffHours < 24) {
        timeRanges["4-24 hours"]++;
      } else if (timeDiffHours < 72) {
        timeRanges["1-3 days"]++;
      } else {
        timeRanges["> 3 days"]++;
      }
    });

    return Object.entries(timeRanges).map(([timeRange, count]) => ({
      timeRange,
      count
    }));
  })();



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsCards stats={stats as any} />



      {/* Main Charts */}
      <Charts complaints={complaints} />

      {/* Area of Concern Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Complaint Type Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex justify-center">
            <div className="w-full max-w-4xl">
              {(() => {
                // Calculate area of concern frequency
                const areaData = complaints.reduce((acc: any[], complaint) => {
                  const area = complaint.areaOfConcern || 'Unknown';
                  const existing = acc.find(item => item.area === area);
                  if (existing) {
                    existing.count++;
                  } else {
                    acc.push({ area: area, count: 1 });
                  }
                  return acc;
                }, []).sort((a, b) => b.count - a.count);
                
                if (areaData.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p>No complaint type data available</p>
                      <p className="text-xs mt-1">Total complaints: {complaints.length}</p>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={areaData}
                        margin={{ top: 20, right: 50, left: 50, bottom: 80 }}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="area"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 10 }}
                          interval={0}
                        />
                        <YAxis 
                          allowDecimals={false}
                          domain={[0, Math.max(...areaData.map(d => d.count)) + 1]}
                          width={60}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}`, 'Complaints']}
                          labelFormatter={(label) => `Type: ${label}`}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        >
                          {areaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#EA580C', '#65A30D', '#BE185D', '#374151'][index % 10]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Product-based Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={20}
                      dataKey="value"
                      label={false}
                    >
                      {productData.map((entry, index) => {
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        );
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {priorityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="priority" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="#6B7280"
                      allowDecimals={false}
                      domain={[0, (dataMax: any) => Math.max(5, dataMax)]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TAT */}
        <Card>
          <CardHeader>
            <CardTitle>TAT</CardTitle>
          </CardHeader>
          <CardContent>
            {resolutionTimeData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="timeRange" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="#6B7280"
                      allowDecimals={false}
                      domain={[0, (dataMax: any) => Math.max(1, Math.ceil(dataMax))]}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">No Resolution Data Available</div>
                  <div className="text-sm">
                    TAT analysis will appear once complaints are resolved
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Email Notice */}
      <div className="mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            📧 Daily analytics reports are automatically sent every day at 9:00 AM to the configured email address.
          </p>
        </div>
      </div>
    </div>
  );
}