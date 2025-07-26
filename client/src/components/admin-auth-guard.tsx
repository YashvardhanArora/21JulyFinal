import { useLocation } from "wouter";
import { useEffect } from "react";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const adminSession = localStorage.getItem('adminSession');
  
  if (!adminSession) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}