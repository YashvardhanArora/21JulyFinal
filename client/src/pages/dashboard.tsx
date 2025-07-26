import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { StatsCards } from "@/components/stats-cards";
import { Charts } from "@/components/charts";
import { KanbanBoard } from "@/components/kanban-board";
import { RecentActivity } from "@/components/recent-activity";
import { NotificationIcon } from "@/components/notification-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Complaint } from "@shared/schema";


export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Password change functionality
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    securityKey: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Fetch security keys
  const { data: securityKeys = [] } = useQuery<string[]>({
    queryKey: ["/api/security-keys"],
  });
  
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(passwordForm)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setShowPasswordDialog(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          securityKey: ""
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    }
  };

  const { data: apiComplaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: apiStats } = useQuery({
    queryKey: ["/api/complaints/stats"],
    refetchInterval: 30000,
  });

  // Use all complaints without year filtering
  const complaints = apiComplaints;

  // Calculate stats based on filtered complaints data
  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === "new").length,
    inProgress: complaints.filter(c => c.status === "in-progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
    resolvedToday: complaints.filter(c => {
      const today = new Date();
      const resolvedDate = c.dateOfResolution ? new Date(c.dateOfResolution) : null;
      return resolvedDate && 
        resolvedDate.toDateString() === today.toDateString() &&
        (c.status === "resolved" || c.status === "closed");
    }).length
  };



  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchQuery || 
      complaint.depoPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.voc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.complaintType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.areaOfConcern?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600">Monitor and manage customer complaints</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationIcon />
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one. You'll need a security key.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="security-key">Security Key</Label>
                    <Select value={passwordForm.securityKey} onValueChange={(value) => setPasswordForm(prev => ({ ...prev, securityKey: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a security key" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityKeys.map((key, index) => (
                          <SelectItem key={index} value={key}>
                            Security Key {index + 1}: {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !passwordForm.securityKey || passwordForm.newPassword !== passwordForm.confirmPassword}
                      className="flex-1"
                    >
                      Change Password
                    </Button>
                    <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Charts Section */}
        <Charts complaints={complaints} />

        {/* Complaint Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Complaint Management Board</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="p-6">
            <KanbanBoard complaints={filteredComplaints} isLoading={isLoading} />
          </div>
        </div>


      </div>
    </div>
  );
}
