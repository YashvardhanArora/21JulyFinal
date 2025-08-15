import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ComplaintComments } from '@/components/complaint-comments';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, Database, Search, Filter, Download, Clock, TrendingUp, BarChart3, Activity, Zap, BookOpen, Star, AlertCircle, CheckCircle, CheckCircle2, XCircle, Paperclip, ExternalLink, Settings, Wifi, WifiOff, RefreshCw, MessageCircle } from 'lucide-react';
import { formatDate, hasValidAttachment, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useAsmAuth } from '@/hooks/use-asm-auth';
import { asmApiGet, asmApiPost } from '@/lib/asm-api';
import { NotificationBell } from '@/components/notification-bell';
import { useWebSocketComplaints } from '@/hooks/use-websocket-complaints';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AsmComplaint {
  id: number;
  yearlySequenceNumber?: number;
  complaintType: string;
  productName: string;
  status: string;
  createdAt: string;
  voc: string;
  placeOfSupply?: string;
  areaOfConcern?: string;
  depoPartyName?: string;
  attachment?: string;
  priority?: string;
}

interface QuickAction {
  icon: any;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

interface TimelineActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface SearchFilter {
  id: string;
  name: string;
  filters: {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAsmAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enable real-time complaints via WebSocket
  useWebSocketComplaints();
  
  // Smart search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Activity timeline state
  const [timelineActivities, setTimelineActivities] = useState<TimelineActivity[]>([]);
  
  // Enhanced Offline support
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineData, setOfflineData] = useState<AsmComplaint[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  


  // Enhanced Offline support with sync capabilities
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      await syncOfflineData();
    };
    const handleOffline = () => {
      setIsOffline(true);
      // Save current data to localStorage for offline access
      if (displayComplaints.length > 0) {
        localStorage.setItem('offlineComplaints', JSON.stringify(displayComplaints));
        setOfflineData(displayComplaints);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data on startup
    const savedOfflineData = localStorage.getItem('offlineComplaints');
    if (savedOfflineData) {
      try {
        setOfflineData(JSON.parse(savedOfflineData));
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    }

    // Load offline queue
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Error loading offline queue:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user-specific complaints and statistics with offline support
  const { data: myComplaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ['/api/asm/my-complaints'],
    queryFn: () => asmApiGet<AsmComplaint[]>('/api/asm/my-complaints'),
    enabled: !!user && !isOffline,
    refetchInterval: 2000, // Real-time updates every 2 seconds like chat
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Use complaints data with offline fallback
  const displayComplaints = isOffline && offlineData.length > 0 ? offlineData : myComplaints;

  // Sync offline data when connection is restored
  const syncOfflineData = async () => {
    if (offlineQueue.length === 0) return;
    
    setSyncStatus('syncing');
    try {
      for (const queueItem of offlineQueue) {
        // Process queued actions (complaints, status updates, etc.)
        await processQueueItem(queueItem);
      }
      
      // Clear offline queue
      setOfflineQueue([]);
      localStorage.removeItem('offlineQueue');
      setSyncStatus('synced');
      
      toast({
        title: "Sync Complete",
        description: `${offlineQueue.length} offline actions synchronized`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/asm/my-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asm/my-stats'] });
      
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync Failed",
        description: "Some offline data could not be synchronized",
        variant: "destructive"
      });
    }
  };

  // Process individual queue items
  const processQueueItem = async (queueItem: any) => {
    // Implementation would depend on the type of action
    // For now, just log the action
    console.log('Processing queue item:', queueItem);
  };

  const { data: myStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/asm/my-stats'],
    queryFn: () => asmApiGet<{
      total: number;
      open: number;
      resolved: number;
      closed: number;
    }>('/api/asm/my-stats'),
    enabled: !!user && !isOffline,
    refetchInterval: 3000, // Real-time updates every 3 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 2000, // Consider data stale after 2 seconds
  });



  // Smart search suggestions
  useEffect(() => {
    if (searchQuery.length > 2) {
      const suggestions = displayComplaints
        .filter(complaint => 
          complaint.voc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.areaOfConcern?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.depoPartyName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(complaint => complaint.voc || complaint.productName || complaint.areaOfConcern)
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .slice(0, 5) as string[];
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, displayComplaints]);

  // Initialize timeline activities
  useEffect(() => {
    const activities: TimelineActivity[] = displayComplaints
      .slice(0, 5)
      .map((complaint, index) => ({
        id: `activity-${complaint.id}`,
        type: 'complaint',
        title: `Complaint ${complaint.id} ${getStatusAction(complaint.status)}`,
        description: `${complaint.productName} - ${complaint.areaOfConcern || 'General issue'}`,
        timestamp: complaint.createdAt,
        icon: getStatusIcon(complaint.status),
        color: getStatusColor(complaint.status)
      }));
    
    setTimelineActivities(activities);
  }, [displayComplaints]);

  // Helper functions
  const getStatusAction = (status: string) => {
    switch (status) {
      case 'open': return 'opened';
      case 'resolved': return 'has been resolved';
      case 'closed': return 'was closed';
      default: return 'updated';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Plus;
      case 'resolved': return CheckCircle2;
      case 'closed': return FileText;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };





  const detectDuplicates = (complaint: AsmComplaint) => {
    return displayComplaints.filter(c => 
      c.id !== complaint.id &&
      c.productName === complaint.productName &&
      c.areaOfConcern === complaint.areaOfConcern &&
      Math.abs(new Date(c.createdAt).getTime() - new Date(complaint.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    );
  };

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      icon: Plus,
      title: 'New Complaint',
      description: 'Submit a new complaint quickly',
      action: () => setLocation('/asm/new-complaint'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Search,
      title: 'Track Complaints',
      description: 'Find and track complaint status',
      action: () => setLocation('/asm/track-complaints'),
      color: 'bg-green-500 hover:bg-green-600'
    },

  ];

  // Filter complaints based on search and filters
  const filteredComplaints = displayComplaints.filter(complaint => {
    const matchesSearch = !searchQuery || 
      complaint.voc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.areaOfConcern?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.depoPartyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;

    
    let matchesDateRange = true;
    if (dateFromFilter || dateToFilter) {
      const complaintDate = new Date(complaint.createdAt);
      if (dateFromFilter) matchesDateRange = matchesDateRange && complaintDate >= new Date(dateFromFilter);
      if (dateToFilter) matchesDateRange = matchesDateRange && complaintDate <= new Date(dateToFilter);
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Export functionality
  const exportFilteredComplaints = () => {
    const csvContent = [
      ['ID', 'Type', 'Product', 'Status', 'Created', 'Description'],
      ...filteredComplaints.map(complaint => [
        complaint.id,
        complaint.complaintType,
        complaint.productName,
        complaint.status,

        new Date(complaint.createdAt).toLocaleDateString(),
        complaint.voc?.substring(0, 100) + '...'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asm-complaints-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export Complete",
      description: `Exported ${filteredComplaints.length} complaints to CSV`,
    });
  };



  // Save search filter
  const saveCurrentFilter = () => {
    const filterName = prompt('Enter a name for this search filter:');
    if (filterName) {
      const newFilter: SearchFilter = {
        id: Date.now().toString(),
        name: filterName,
        filters: {
          search: searchQuery,
          status: statusFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter
        }
      };
      
      const updatedFilters = [...savedFilters, newFilter];
      setSavedFilters(updatedFilters);
      localStorage.setItem('asm-saved-filters', JSON.stringify(updatedFilters));
      
      toast({
        title: "Filter Saved",
        description: `Search filter "${filterName}" has been saved`,
      });
    }
  };

  // Load saved filter
  const loadSavedFilter = (filter: SearchFilter) => {
    setSearchQuery(filter.filters.search);
    setStatusFilter(filter.filters.status);
    setDateFromFilter(filter.filters.dateFrom);
    setDateToFilter(filter.filters.dateTo);
  };

  // Load saved filters on mount
  useEffect(() => {
    const saved = localStorage.getItem('asm-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Chart data
  const chartData = [
    { name: 'Open', value: myStats?.open || 0, color: '#EF4444' },
    { name: 'Resolved', value: myStats?.resolved || 0, color: '#10B981' },
    { name: 'Closed', value: myStats?.closed || 0, color: '#6B7280' }
  ];

  const trendData = displayComplaints.slice(0, 7).map((complaint, index) => ({
    day: `Day ${7 - index}`,
    complaints: Math.floor(Math.random() * 5) + 1 // Simulated trend data
  }));

  const isLoading = complaintsLoading || statsLoading;



  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }





  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ASM Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setLocation('/asm/new-complaint')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>
      
      <div className="p-4 md:p-6">
        <div className="space-y-6">


          {/* Welcome section with offline indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-gray-600 flex items-center gap-2">
                Welcome back, {user?.firstName} {user?.lastName}
                {isOffline && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline Mode
                  </span>
                )}
                {syncStatus === 'syncing' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Syncing...
                  </span>
                )}
                {syncStatus === 'synced' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <Wifi className="w-3 h-3 mr-1" />
                    Synced
                  </span>
                )}
              </p>
            </div>

          </div>

          {/* Complaint Processing Pipeline */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Complaint Processing Pipeline</h3>
            <div className="flex items-center justify-between">
              {/* Open Stage */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                  (myStats?.open || 0) > 0 ? 'bg-red-500 text-white shadow-lg scale-110' : 'bg-red-100 text-red-600'
                }`}>
                  <Plus className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-gray-900 mb-1">Open</span>
                <span className="text-2xl font-bold text-red-600">{myStats?.open || 0}</span>
                <span className="text-xs text-gray-500 mt-1">Complaints</span>
              </div>
              
              {/* Progress line */}
              <div className="flex-1 px-4">
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  (myStats?.resolved || 0) > 0 ? 'bg-gradient-to-r from-red-500 to-green-500' : 'bg-gray-200'
                }`}></div>
              </div>
              
              {/* Resolved Stage */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                  (myStats?.resolved || 0) > 0 ? 'bg-green-500 text-white shadow-lg scale-110' : 'bg-green-100 text-green-600'
                }`}>
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-gray-900 mb-1">Resolved</span>
                <span className="text-2xl font-bold text-green-600">{myStats?.resolved || 0}</span>
                <span className="text-xs text-gray-500 mt-1">Fixed</span>
              </div>
              
              {/* Progress line */}
              <div className="flex-1 px-4">
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  (myStats?.closed || 0) > 0 ? 'bg-gradient-to-r from-green-500 to-gray-500' : 'bg-gray-200'
                }`}></div>
              </div>
              
              {/* Completed Stage */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                  (myStats?.closed || 0) > 0 ? 'bg-gray-500 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Star className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-gray-900 mb-1">Completed</span>
                <span className="text-2xl font-bold text-gray-600">{myStats?.closed || 0}</span>
                <span className="text-xs text-gray-500 mt-1">Closed</span>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{myStats?.total || 0}</span>
                  <p className="text-sm text-gray-600">Total Complaints</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-600">
                    {myStats?.total ? Math.round(((myStats.resolved || 0) / myStats.total) * 100) : 0}%
                  </span>
                  <p className="text-sm text-gray-600">Resolution Rate</p>
                </div>
              </div>
            </div>
          </div>



          {/* Smart Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main search bar with suggestions */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search complaints by description, product, or area of concern..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Search suggestions dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setSearchQuery(suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>



                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Advanced
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCurrentFilter}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Save Filter
                  </Button>
                </div>

                {/* Advanced filters */}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                      <Input
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <Input
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Saved filters */}
                {savedFilters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saved Filters</label>
                    <div className="flex flex-wrap gap-2">
                      {savedFilters.map((filter) => (
                        <Button
                          key={filter.id}
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedFilter(filter)}
                          className="text-xs"
                        >
                          {filter.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results summary */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {filteredComplaints.length} of {displayComplaints.length} complaints
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Complaints List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Complaints View ({filteredComplaints.length})
                </span>
                <Button onClick={() => setLocation('/asm/new-complaint')} className="hidden md:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  New Complaint
                </Button>
              </CardTitle>
              <CardDescription>
                Complaint management and tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading your complaints...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {displayComplaints.length === 0 ? 'No complaints yet' : 'No matching complaints'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {displayComplaints.length === 0 
                      ? 'Start by submitting your first complaint or load sample data to explore features.'
                      : 'Try adjusting your search filters to find more complaints.'
                    }
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setLocation('/asm/new-complaint')}
                      className="w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Submit New Complaint
                    </Button>

                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map((complaint: AsmComplaint) => {
                    const duplicates = detectDuplicates(complaint);
                    
                    return (
                      <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                        <div className="flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Complaint #{complaint.id}
                              </h3>
                              <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status}
                              </Badge>

                              {duplicates.length > 0 && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  {duplicates.length} similar
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    Respond
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">
                                      <MessageCircle className="w-5 h-5 text-blue-600" />
                                      <span>Chat: Complaint #{complaint.yearlySequenceNumber || complaint.id}</span>
                                      <Badge className={getStatusColor(complaint.status)}>
                                        {complaint.status}
                                      </Badge>
                                    </DialogTitle>
                                    <div className="text-sm text-gray-600 mt-2">
                                      <strong>{complaint.complaintType}:</strong> {complaint.areaOfConcern || 'General Issue'}
                                      {complaint.depoPartyName && (
                                        <span className="ml-2">• <strong>Party:</strong> {complaint.depoPartyName}</span>
                                      )}
                                    </div>
                                  </DialogHeader>
                                  
                                  <div className="mt-4">
                                    <ComplaintComments
                                      complaintId={complaint.id}
                                      complaintStatus={complaint.status}
                                      currentUserRole="customer"
                                      currentUserId={user?.id || 0}
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/asm/track-complaints?id=${complaint.id}`)}
                                className="flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Details
                              </Button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {complaint.complaintType} - {complaint.productName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {complaint.voc}
                                </p>
                              </div>
                              
                              {complaint.areaOfConcern && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <AlertCircle className="w-3 h-3" />
                                  {complaint.areaOfConcern}
                                  {complaint.placeOfSupply && ` • ${complaint.placeOfSupply}`}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Created: {formatDate(complaint.createdAt)}
                                </p>
                                {hasValidAttachment(complaint.attachment) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => window.open(`/api/files/${encodeURIComponent(complaint.attachment || '')}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 h-6 px-2"
                                  >
                                    <Paperclip className="w-3 h-3 mr-1" />
                                    <span className="text-xs">File</span>
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Delivery App Style Status Bar */}
                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                              <h4 className="text-sm font-medium text-gray-800 mb-3">Order Status</h4>
                              
                              {/* Progress Steps */}
                              <div className="relative">
                                {/* Progress Line */}
                                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                                  <div 
                                    className={`h-full bg-blue-500 transition-all duration-700 ${
                                      complaint.status === 'open' ? 'w-0' :
                                      complaint.status === 'resolved' ? 'w-1/2' :
                                      'w-full'
                                    }`}
                                  />
                                </div>
                                
                                {/* Status Steps - 3 stages: open, resolved, closed */}
                                <div className="relative flex justify-between">
                                  {/* Open */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                      complaint.status === 'open' || complaint.status === 'resolved' || complaint.status === 'closed'
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                      <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs mt-1 font-medium text-gray-600">Open</span>
                                  </div>
                                  
                                  {/* Resolved */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                      complaint.status === 'resolved' || complaint.status === 'closed'
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs mt-1 font-medium text-gray-600">Resolved</span>
                                  </div>
                                  
                                  {/* Closed */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                      complaint.status === 'closed'
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                      <Star className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs mt-1 font-medium text-gray-600">Closed</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Status Message */}
                              <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  {complaint.status === 'open' && 'We are actively working on resolving your complaint.'}
                                  {complaint.status === 'resolved' && 'Your complaint has been resolved. Please review the solution.'}
                                  {complaint.status === 'closed' && 'Your complaint has been successfully completed.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Progress Indicator */}
                          <div className="block md:hidden mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">Progress</span>
                              <span className="text-xs text-blue-600 font-medium capitalize">{complaint.status}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-700 bg-blue-500 ${
                                  complaint.status === 'open' ? 'w-1/3' :
                                  complaint.status === 'resolved' ? 'w-2/3' :
                                  'w-full'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Real-time Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Complaints */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{myStats?.total || 0}</p>
                    <p className="text-sm text-gray-600">Total Complaints</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Open Complaints */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{myStats?.open || 0}</p>
                    <p className="text-sm text-gray-600">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resolved Complaints */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{myStats?.resolved || 0}</p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closed Complaints */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{myStats?.closed || 0}</p>
                    <p className="text-sm text-gray-600">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}