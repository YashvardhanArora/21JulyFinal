import { useLocation } from "wouter";
import { useEffect } from "react";
import { usePrefetchData } from "@/hooks/use-prefetch-data";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();

  // Prefetch data as soon as authentication is confirmed
  usePrefetchData();

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