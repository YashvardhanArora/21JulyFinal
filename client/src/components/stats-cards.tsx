import { Card, CardContent } from "@/components/ui/card";
import { Clock, ClipboardList, CheckCircle, Hourglass } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
    resolvedToday: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Complaints",
      value: stats.total,
      icon: ClipboardList,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      title: "Open Cases",
      value: stats.new + stats.inProgress,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: Hourglass,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={card.title} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {typeof card.value === "number" ? card.value : card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor} text-xl w-6 h-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
