import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface AsmUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function useAsmAuth() {
  const [user, setUser] = useState<AsmUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const asmUser = localStorage.getItem('asmUser');
      const asmToken = localStorage.getItem('asmToken');
      
      if (!asmUser || !asmToken) {
        setLocation('/login');
        setIsLoading(false);
        return;
      }
      
      try {
        const parsedUser = JSON.parse(asmUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('asmUser');
        localStorage.removeItem('asmToken');
        setLocation('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [setLocation]);

  const logout = () => {
    localStorage.removeItem('asmToken');
    localStorage.removeItem('asmUser');
    setUser(null);
    setLocation('/login');
  };

  return {
    user,
    isLoading,
    logout,
    isAuthenticated: !!user
  };
}