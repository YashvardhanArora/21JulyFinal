import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ComplaintUpdateMessage {
  type: 'complaint_update';
  action: 'created' | 'updated' | 'deleted';
  data: any;
}

export function useWebSocketComplaints() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let websocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      try {
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log('WebSocket connected for complaints');
          reconnectAttempts = 0;
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ComplaintUpdateMessage;
            
            if (message.type === 'complaint_update') {
              // Invalidate complaint-related queries to trigger refresh
              queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
              queryClient.invalidateQueries({ queryKey: ['/api/complaints/stats'] });
              queryClient.invalidateQueries({ queryKey: ['/api/asm/my-complaints'] });
              queryClient.invalidateQueries({ queryKey: ['/api/asm/my-stats'] });
              
              console.log(`Complaint ${message.action}:`, message.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected for complaints');
          
          // Attempt to reconnect if within retry limit
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
            
            reconnectTimeout = setTimeout(() => {
              connect();
            }, delay);
          }
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [queryClient]);
}