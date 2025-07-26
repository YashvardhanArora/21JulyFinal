import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Complaint } from "@shared/schema";

interface NotificationContextType {
  newComplaints: Complaint[];
  unreadCount: number;
  markAsRead: () => void;
  lastLoginTime: Date | null;
  setLastLoginTime: (time: Date) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [lastLoginTime, setLastLoginTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastLoginTime');
    return saved ? new Date(saved) : null;
  });
  
  const [hasReadNotifications, setHasReadNotifications] = useState(false);

  const { data: complaints = [] } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get new complaints since last login
  const newComplaints = complaints.filter(complaint => {
    if (!lastLoginTime) return false;
    return complaint.status === "new" && new Date(complaint.createdAt) > lastLoginTime;
  });

  const unreadCount = hasReadNotifications ? 0 : newComplaints.length;

  const markAsRead = () => {
    setHasReadNotifications(true);
  };

  const handleSetLastLoginTime = (time: Date) => {
    setLastLoginTime(time);
    localStorage.setItem('lastLoginTime', time.toISOString());
    setHasReadNotifications(false);
  };

  // Set initial login time if not set
  useEffect(() => {
    if (!lastLoginTime) {
      const now = new Date();
      handleSetLastLoginTime(now);
    }
  }, [lastLoginTime]);

  return (
    <NotificationContext.Provider value={{
      newComplaints,
      unreadCount,
      markAsRead,
      lastLoginTime,
      setLastLoginTime: handleSetLastLoginTime,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};