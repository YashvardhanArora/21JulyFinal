import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAsmAuth } from './use-asm-auth';

export interface Notification {
  id: number;
  userId: number;
  complaintId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAsmAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    queryFn: () => fetch(`/api/notifications?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    refetchInterval: 5000 // Refetch every 5 seconds as fallback
  });

  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['/api/notifications/unread', user?.id],
    queryFn: () => fetch(`/api/notifications/unread?userId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
    refetchInterval: 3000 // More frequent for unread notifications
  });

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [queryClient]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user?.id, queryClient]);

  // WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setSocket(ws);
        
        // Authenticate with user ID
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
        
        console.log('WebSocket connected for notifications');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_notification') {
            // New notification received - refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
            
            // Sound notifications disabled - no audio alerts
            
            // Show notification toast or update UI
            console.log('New notification received:', data.data);
          } else if (data.type === 'notifications') {
            // Initial notifications data
            console.log('Initial notifications:', data.data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [user?.id, queryClient]);

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead
  };
}