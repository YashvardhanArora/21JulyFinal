import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAsmSidebarContext } from '@/contexts/AsmSidebarContext';
import { useAsmAuth } from '@/hooks/use-asm-auth';
import logoPath from '@assets/logo_1752043363523.png';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Home, 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  ChevronLeft,
  User
} from 'lucide-react';

interface AsmSidebarProps {
  className?: string;
}

export function AsmSidebar({ className }: AsmSidebarProps) {
  const [location, setLocation] = useLocation();
  const { isCollapsed, toggleSidebar } = useAsmSidebarContext();
  const { user, logout } = useAsmAuth();
  const [currentUser, setCurrentUser] = useState(user);

  // Listen for real-time profile updates
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      setCurrentUser(event.detail);
    };

    window.addEventListener('asmUserUpdated', handleUserUpdate as EventListener);
    
    return () => {
      window.removeEventListener('asmUserUpdated', handleUserUpdate as EventListener);
    };
  }, []);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const navigationItems = [
    {
      icon: Home,
      label: 'ASM Dashboard',
      href: '/asm/dashboard',
      isActive: location === '/asm/dashboard'
    },
    {
      icon: Plus,
      label: 'New Complaint',
      href: '/asm/new-complaint',
      isActive: location === '/asm/new-complaint'
    },
    {
      icon: Search,
      label: 'Track Complaints',
      href: '/asm/track-complaints',
      isActive: location === '/asm/track-complaints'
    },
    {
      icon: Settings,
      label: 'Account Settings',
      href: '/asm/settings',
      isActive: location === '/asm/settings'
    }
  ];

  return (
    <aside className={cn(
      "bg-white shadow-lg flex flex-col transition-all duration-200 ease-out sticky top-0 h-screen",
      isCollapsed ? "w-16 sidebar-collapsed overflow-hidden" : "w-64 sidebar-scroll overflow-y-auto"
    )}>
      <div className={cn(
        "border-b border-gray-200 relative transition-all duration-200 ease-out",
        isCollapsed ? "py-4 px-2 flex flex-col items-center space-y-3" : "p-6 flex items-center justify-between"
      )}>
        <div className={cn(
          "transition-all duration-200 ease-out overflow-hidden",
          isCollapsed ? "w-0 h-0 opacity-0" : "w-auto h-auto opacity-100"
        )}>
          <img 
            src={logoPath} 
            alt="BN Group Logo" 
            loading="eager"
            className="h-24 object-contain" 
          />
        </div>

        {/* Toggle button */}
        <div className={cn(
          "transition-all duration-200 ease-out flex items-center gap-2",
          isCollapsed ? "w-full flex justify-center" : ""
        )}>
          <button
            onClick={toggleSidebar}
            className={cn(
              "rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out",
              isCollapsed ? "p-1.5" : "p-2"
            )}
          >
            <div className="transition-transform duration-300 ease-in-out">
              {isCollapsed ? (
                <Menu className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </button>
        </div>
      </div>



      
      <nav className={cn(
        "flex-1 py-6 space-y-2 transition-all duration-200 ease-out",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-lg font-medium transition-all duration-200 ease-out cursor-pointer hover:scale-[1.02] hover:shadow-sm",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  item.isActive
                    ? "text-primary bg-blue-50 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                )}
                title={isCollapsed ? item.label : undefined}
                onClick={() => setLocation(item.href)}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-150 ease-out",
                  !isCollapsed && "mr-3"
                )} />
                <span className={cn(
                  "transition-all duration-200 ease-out overflow-hidden whitespace-nowrap",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </nav>

      
      <div className={cn(
        "border-t border-gray-200 transition-all duration-200 ease-out",
        isCollapsed ? "p-2 space-y-2" : "p-4 space-y-3"
      )}>
        {currentUser && (
          <div className={cn(
            "flex items-center transition-all duration-200 ease-out",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {currentUser.profilePicture ? (
                <img 
                  src={currentUser.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>
                  {currentUser.firstName && currentUser.lastName 
                    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
                    : currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'
                  }
                </span>
              )}
            </div>
            <div className={cn(
              "ml-3 transition-all duration-200 ease-out overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-xs text-gray-500 whitespace-nowrap">{currentUser.email}</p>
            </div>
          </div>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full rounded-lg font-medium transition-all duration-200 ease-out text-red-600 hover:bg-red-50 hover:scale-[1.02] hover:shadow-sm",
                isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className={cn(
                "w-5 h-5 transition-all duration-150 ease-out",
                !isCollapsed && "mr-3"
              )} />
              <span className={cn(
                "transition-all duration-200 ease-out overflow-hidden whitespace-nowrap",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Logout
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  logout();
                  setLocation('/');
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}