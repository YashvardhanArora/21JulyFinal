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
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

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

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setLocation('/admin/login');
  };

  return (
    <aside className={cn(
      "bg-white shadow-lg flex flex-col transition-all duration-200 ease-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-gray-200 relative transition-all duration-200 ease-out",
        isCollapsed ? "py-4 px-2 flex flex-col items-center space-y-3" : "p-6 flex items-center justify-between"
      )}>
        <div className={cn(
          "transition-all duration-200 ease-out overflow-hidden",
          isCollapsed ? "w-0 h-0 opacity-0" : "w-auto h-auto opacity-100"
        )}>
          <img src="/bn-logo.png" alt="BN Logo" className="h-24 object-contain" />
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
            <User className="w-4 h-4" />
          </div>
          <div className={cn(
            "ml-3 transition-all duration-200 ease-out overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 whitespace-nowrap">{profile.email || 'Loading...'}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
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
      </div>
    </aside>
  );
}
