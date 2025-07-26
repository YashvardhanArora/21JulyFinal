import { useState, useRef, useEffect } from "react";
import { Bell, X, Clock, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification } from "@/contexts/NotificationContext";
import { formatRelativeTime, getPriorityColor } from "@/lib/utils";

export function NotificationIcon() {
  const { newComplaints, unreadCount, markAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsClicked(true);
    if (!isOpen) {
      markAsRead();
    }
    setIsOpen(!isOpen);
    setTimeout(() => setIsClicked(false), 600);
  };

  return (
    <div className="relative" ref={notificationRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-gray-100 transition-all duration-200 ease-in-out"
        onClick={handleToggle}
      >
        <Bell className={`h-5 w-5 transition-all duration-200 ease-in-out ${
          isOpen ? "scale-110 text-blue-600" : "hover:scale-105"
        } ${isClicked ? "bell-click" : ""}`} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto shadow-lg border z-50 animate-in slide-in-from-top-4 fade-in-0 duration-300 ease-out scale-in-95">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>New Complaints</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {newComplaints.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No new complaints since last login
              </div>
            ) : (
              <div className="space-y-3">
                {newComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">
                          #{complaint.yearlySequenceNumber || complaint.id}
                        </span>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatRelativeTime(complaint.createdAt)}
                      </div>
                    </div>
                    
                    <h6 className="font-medium text-sm mb-1">
                      {complaint.complaintType}: {complaint.areaOfConcern || 'General Issue'}
                    </h6>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        <span className="truncate">{complaint.depoPartyName}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{complaint.placeOfSupply}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}