import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  FileText, 
  List, 
  PieChart, 
  Settings, 
  User,
  Menu,
  ChevronLeft,
  LogOut,
  Share2,
  ExternalLink,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import logoPath from '@assets/logo_1752043363523.png';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

const navigation = [
  { name: "Dashboard", href: "/admin", icon: PieChart },
  { name: "All Complaints", href: "/admin/complaints", icon: List },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear all admin authentication data
    localStorage.removeItem('adminSession');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLocation('/admin/login');
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/complaints`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Share Link Copied",
        description: "The shareable complaints dashboard link has been copied to your clipboard.",
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Share Link Copied",
        description: "The shareable complaints dashboard link has been copied to your clipboard.",
      });
    });
  };

  const handleOpenShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/complaints`;
    window.open(shareUrl, '_blank');
  };

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
            decoding="sync"
            className="h-24 object-contain" 
          />
        </div>

        {/* Toggle button */}
        <div className={cn(
          "transition-all duration-200 ease-out",
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
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-lg font-medium transition-all duration-150 ease-out cursor-pointer",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-150 ease-out",
                  !isCollapsed && "mr-3"
                )} />
                <span className={cn(
                  "transition-all duration-200 ease-out overflow-hidden whitespace-nowrap",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Share Functionality */}
        <div className={cn(
          "pt-4 border-t border-gray-200",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <div className={cn(
            "space-y-2",
            isCollapsed && "flex flex-col items-center"
          )}>
            <span className={cn(
              "text-xs font-medium text-gray-500 uppercase tracking-wide transition-all duration-200 ease-out",
              isCollapsed ? "hidden" : "block"
            )}>
              Share Dashboard
            </span>
            
            <div className={cn(
              "flex gap-2",
              isCollapsed ? "flex-col" : "flex-row"
            )}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLink}
                className={cn(
                  "flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 h-7 px-2 text-xs",
                  isCollapsed ? "w-7 h-7 p-0 justify-center" : "flex-1"
                )}
                title={isCollapsed ? "Copy Share Link" : undefined}
                data-testid="button-copy-share-link"
              >
                <Copy className="w-3 h-3" />
                <span className={cn(
                  "transition-all duration-200 ease-out overflow-hidden whitespace-nowrap",
                  isCollapsed ? "hidden" : "block"
                )}>
                  Copy Link
                </span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenShareLink}
                className={cn(
                  "flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50 h-7 px-2 text-xs",
                  isCollapsed ? "w-7 h-7 p-0 justify-center" : "flex-1"
                )}
                title={isCollapsed ? "Open Share View" : undefined}
                data-testid="button-open-share-view"
              >
                <ExternalLink className="w-3 h-3" />
                <span className={cn(
                  "transition-all duration-200 ease-out overflow-hidden whitespace-nowrap",
                  isCollapsed ? "hidden" : "block"
                )}>
                  Open View
                </span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className={cn(
        "border-t border-gray-200 transition-all duration-200 ease-out",
        isCollapsed ? "p-2 space-y-2" : "p-4 space-y-3"
      )}>
        <div className={cn(
          "flex items-center transition-all duration-200 ease-out",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
            {profile.firstName && profile.lastName ? (
              <span>
                {profile.firstName.charAt(0).toUpperCase()}{profile.lastName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className={cn(
            "ml-3 transition-all duration-200 ease-out overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
            </p>
            <p className="text-[11px] text-gray-500 whitespace-nowrap">{profile.email || 'Loading...'}</p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full rounded-lg font-medium transition-all duration-150 ease-out text-red-600 hover:bg-red-50",
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
                onClick={handleLogout}
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
