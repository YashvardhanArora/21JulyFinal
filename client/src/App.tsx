import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import ComplaintsPage from "@/pages/complaints";
import AnalyticsPage from "@/pages/analytics";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminComplaintForm from "@/pages/admin-complaint-form";
import NotFound from "@/pages/not-found";
import CustomerLogin from "@/pages/customer-login";
import CustomerRegister from "@/pages/customer-register";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerComplaintForm from "@/pages/customer-complaint-form";
import CustomerTrackComplaints from "@/pages/customer-track-complaints";

import CustomerSettings from "@/pages/customer-settings";
import AdminLogin from "@/pages/admin-login";
import SharedComplaintsView from "@/pages/shared-complaints-view";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AsmSidebarProvider } from "@/contexts/AsmSidebarContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { AsmSidebar } from "@/components/asm-sidebar";
import { YearProvider } from "@/contexts/year-context";
import { usePrefetchData } from "@/hooks/use-prefetch-data";

function Router() {
  return (
    <Switch>
      {/* Default route - ASM Login */}
      <Route path="/" component={CustomerLogin} />
      
      {/* ASM Panel Routes (no sidebar) */}
      <Route path="/login" component={CustomerLogin} />
      <Route path="/register" component={CustomerRegister} />
      
      {/* ASM Panel Routes (with sidebar) */}
      <Route path="/asm/dashboard">
        {() => (
          <AsmSidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
              <AsmSidebar />
              <main className="flex-1 main-content-fade">
                <div className="page-enter">
                  <CustomerDashboard />
                </div>
              </main>
            </div>
          </AsmSidebarProvider>
        )}
      </Route>
      <Route path="/asm/new-complaint">
        {() => (
          <AsmSidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
              <AsmSidebar />
              <main className="flex-1 main-content-fade">
                <div className="page-enter">
                  <CustomerComplaintForm />
                </div>
              </main>
            </div>
          </AsmSidebarProvider>
        )}
      </Route>
      <Route path="/asm/complaints/edit/:id">
        {(params: { id: string }) => (
          <AsmSidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
              <AsmSidebar />
              <main className="flex-1 main-content-fade">
                <div className="page-enter">
                  <CustomerComplaintForm complaintId={parseInt(params.id)} />
                </div>
              </main>
            </div>
          </AsmSidebarProvider>
        )}
      </Route>
      <Route path="/asm/track-complaints">
        {() => (
          <AsmSidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
              <AsmSidebar />
              <main className="flex-1 main-content-fade">
                <div className="page-enter">
                  <CustomerTrackComplaints />
                </div>
              </main>
            </div>
          </AsmSidebarProvider>
        )}
      </Route>

      <Route path="/asm/settings">
        {() => (
          <AsmSidebarProvider>
            <div className="flex min-h-screen bg-gray-50">
              <AsmSidebar />
              <main className="flex-1 main-content-fade">
                <div className="page-enter">
                  <CustomerSettings />
                </div>
              </main>
            </div>
          </AsmSidebarProvider>
        )}
      </Route>
      
      {/* Shared Complaints View (no auth required) */}
      <Route path="/shared/complaints" component={SharedComplaintsView} />
      
      {/* Admin Login */}
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Admin Portal Routes (with sidebar) */}
      <Route path="/admin">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <Dashboard />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/dashboard">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <Dashboard />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/complaints">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <ComplaintsPage />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <AnalyticsPage />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/reports">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <ReportsPage />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <SettingsPage />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      <Route path="/admin/new-complaint">
        {() => (
          <AdminAuthGuard>
            <UserProfileProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />
                    <main className="flex-1 main-content-fade">
                      <div className="page-enter">
                        <AdminComplaintForm />
                      </div>
                    </main>
                  </div>
                </NotificationProvider>
              </SidebarProvider>
            </UserProfileProvider>
          </AdminAuthGuard>
        )}
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <YearProvider>
          <Toaster />
          <Router />
        </YearProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
