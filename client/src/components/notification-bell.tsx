import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { 
    notifications, 
    unreadNotifications, 
    unreadCount, 
    isLoading, 
    isConnected,
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative hover:bg-gray-100 transition-all duration-200 ease-in-out"
        onClick={() => {
          setIsClicked(true);
          setIsOpen(!isOpen);
          setTimeout(() => setIsClicked(false), 200);
        }}
      >
        <Bell className={cn(
          "h-5 w-5 transition-all duration-200 ease-in-out",
          isOpen ? "scale-110 text-blue-600" : "hover:scale-105",
          isClicked && "bell-click"
        )} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse" 
               title="Reconnecting..." />
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 notification-dropdown">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between animate-in fade-in-0 slide-in-from-top-2 duration-200 delay-100">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto animate-in fade-in-0 duration-300 delay-150">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500 animate-pulse">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 animate-in fade-in-0 duration-300">
                No notifications yet
              </div>
            ) : (
              <>
                {notifications.slice(0, 10).map((notification, index) => (
                  <div 
                    key={notification.id}
                    className={`p-3 cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50 hover:scale-[1.02] hover:shadow-sm border-b border-gray-100 notification-item ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    style={{ 
                      animationDelay: `${(index * 80) + 200}ms`
                    }}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          {notification.type === 'status_update' && (
                            <Badge variant="outline" className="text-xs">
                              Status Update
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="p-2 text-center">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View all notifications
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}