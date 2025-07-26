import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { ComplaintHistory } from "@shared/schema";

export function RecentActivity() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["/api/complaints"],
  });

  // Create recent activity from complaints data
  const recentActivity = complaints
    .slice(0, 10)
    .map(complaint => ({
      id: complaint.id,
      action: `Complaint #${complaint.id} - ${complaint.subject}`,
      type: complaint.status === "new" ? "created" : "updated",
      user: complaint.assignedTo || "System",
      timestamp: complaint.updatedAt,
      status: complaint.status,
    }));

  const getActivityIcon = (type: string, status: string) => {
    if (type === "created") return "🆕";
    if (status === "resolved") return "✅";
    if (status === "in-progress") return "🔄";
    return "📝";
  };

  const getActivityColor = (type: string, status: string) => {
    if (type === "created") return "bg-blue-500";
    if (status === "resolved") return "bg-green-500";
    if (status === "in-progress") return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div 
                  className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type, activity.status)}`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.type === "created" ? "created" : "updated"} complaint{" "}
                    <span className="font-medium">#{activity.id}</span> - {activity.action.split(" - ")[1]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
