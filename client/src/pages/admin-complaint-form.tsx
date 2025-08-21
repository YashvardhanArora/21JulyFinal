import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Upload, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { NotificationIcon } from '@/components/notification-icon';
import { 
  COMPLAINT_SOURCES, 
  COMPLAINT_TYPES, 
  COMPLAINT_CATEGORIES, 
  PLACE_OF_SUPPLY_OPTIONS,
  PRODUCT_NAMES,
  AREA_OF_CONCERNS, 
  SUB_CATEGORIES,
  AREA_OF_CONCERN_SUB_CATEGORIES
} from '@/../../shared/schema';

// Dropdown options
const REGIONS = [
  "North India", "South India", "East India", "West India", "Central India", 
  "Northeast India", "Delhi NCR", "Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad"
];



const complaintSchema = z.object({
  // Customer Details
  depoPartyName: z.string().optional(),
  email: z.string().optional(),
  contactNumber: z.string().optional(),
  
  // Complaint Location & Source
  complaintSource: z.string().optional(),
  placeOfSupply: z.string().optional(),
  complaintReceivingLocation: z.string().optional(),
  date: z.string().optional(),
  
  // Complaint Details
  complaintType: z.string().optional(),
  salesPersonName: z.string().optional(),
  productName: z.string().optional(),
  areaOfConcern: z.string().optional(),
  subCategory: z.string().optional(),
  
  // Invoice & Transport Details
  invoiceNo: z.string().optional(),
  invoiceDate: z.string().optional(),
  lrNumber: z.string().optional(),
  transporterName: z.string().optional(),
  transporterNumber: z.string().optional(),
  
  // Description
  voiceOfCustomer: z.string().optional(),
  
  // Resolution Details (New fields from Excel template)
  actionTaken: z.string().optional(),
  creditDate: z.string().optional(),
  creditNoteNumber: z.string().optional(),
  creditAmount: z.string().optional(),
  personResponsible: z.string().optional(),
  rootCauseActionPlan: z.string().optional(),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface AdminComplaintFormProps {
  complaintId?: number;
}

export default function AdminComplaintForm({ complaintId }: AdminComplaintFormProps) {
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(!!complaintId);
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [complaintCode, setComplaintCode] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  
  // Legacy state - no longer needed but keeping for backward compatibility
  const [customValues] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing complaint data if in edit mode
  const { data: existingComplaint, isLoading: isLoadingComplaint } = useQuery({
    queryKey: ['/api/complaints', complaintId],
    queryFn: () => {
      if (!complaintId) return null;
      return fetch(`/api/complaints/${complaintId}`).then(res => res.json());
    },
    enabled: !!complaintId,
  });

  // These helper functions are no longer needed since we're using direct form field binding
  // Keeping them for any remaining legacy code that might reference them
  const handleDropdownChange = () => {};
  const handleCustomInputChange = () => {};

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      depoPartyName: '',
      email: '',
      contactNumber: '',
      complaintSource: '',
      placeOfSupply: '',
      complaintReceivingLocation: '',
      date: '',
      complaintType: '',
      salesPersonName: '',
      productName: '',
      areaOfConcern: '',
      subCategory: '',
      invoiceNo: '',
      invoiceDate: '',
      lrNumber: '',
      transporterName: '',
      transporterNumber: '',
      voiceOfCustomer: '',
      actionTaken: '',
      creditDate: '',
      creditNoteNumber: '',
      creditAmount: '',
      personResponsible: '',
      rootCauseActionPlan: '',
    },
  });

  // Watch for area of concern changes to filter subcategories
  const watchedAreaOfConcern = form.watch('areaOfConcern');
  
  useEffect(() => {
    if (watchedAreaOfConcern && AREA_OF_CONCERN_SUB_CATEGORIES[watchedAreaOfConcern]) {
      setAvailableSubCategories(AREA_OF_CONCERN_SUB_CATEGORIES[watchedAreaOfConcern]);
      // Reset subcategory if current value is not in the filtered list
      const currentSubCategory = form.getValues('subCategory');
      if (currentSubCategory && !AREA_OF_CONCERN_SUB_CATEGORIES[watchedAreaOfConcern].includes(currentSubCategory)) {
        form.setValue('subCategory', '');
      }
    } else {
      setAvailableSubCategories([]);
      form.setValue('subCategory', '');
    }
  }, [watchedAreaOfConcern, form]);

  // Effect to populate form when editing existing complaint
  useEffect(() => {
    if (existingComplaint && isEditMode) {
      // Populate all form fields with existing data
      form.reset({
        depoPartyName: existingComplaint.depoPartyName || '',
        email: existingComplaint.email || '',
        contactNumber: existingComplaint.contactNumber || '',
        complaintSource: existingComplaint.complaintSource || '',
        placeOfSupply: existingComplaint.placeOfSupply || '',
        complaintReceivingLocation: existingComplaint.complaintReceivingLocation || '',
        date: existingComplaint.date || '',
        complaintType: existingComplaint.complaintType || '',
        salesPersonName: existingComplaint.salePersonName || '',
        productName: existingComplaint.productName || '',
        areaOfConcern: existingComplaint.areaOfConcern || '',
        subCategory: existingComplaint.subCategory || '',
        invoiceNo: existingComplaint.invoiceNo || '',
        invoiceDate: existingComplaint.invoiceDate || '',
        lrNumber: existingComplaint.lrNumber || '',
        transporterName: existingComplaint.transporterName || '',
        transporterNumber: existingComplaint.transporterNumber || '',
        voiceOfCustomer: existingComplaint.voc || '',
        actionTaken: existingComplaint.actionTaken || '',
        creditDate: existingComplaint.creditDate || '',
        creditNoteNumber: existingComplaint.creditNoteNumber || '',
        creditAmount: existingComplaint.creditAmount || '',
        personResponsible: existingComplaint.personResponsible || '',
        rootCauseActionPlan: existingComplaint.rootCauseActionPlan || '',
      });

      // Set existing attachment info if available
      if (existingComplaint.attachment) {
        setFilePreview(`/api/files/${encodeURIComponent(existingComplaint.attachment)}`);
      }
    }
  }, [existingComplaint, form, isEditMode]);

  const submitComplaintMutation = useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      let attachmentPath = '';

      // Handle file upload if a file is selected (or keep existing attachment)
      if (selectedFile) {
        try {
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          const uploadResponse = await apiRequest('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: selectedFile.name,
              fileData: fileData,
              contentType: selectedFile.type
            }),
          });

          const uploadResult = await uploadResponse.json();
          if (uploadResult.success) {
            attachmentPath = uploadResult.filePath;
            console.log('File uploaded successfully:', uploadResult);
          }
        } catch (error) {
          console.error('File upload failed:', error);
          throw new Error('Failed to upload file. Please try again.');
        }
      }

      // Map form data to match backend structure
      const apiData = {
        complaintSource: data.complaintSource,
        placeOfSupply: data.placeOfSupply,
        complaintReceivingLocation: data.complaintReceivingLocation,
        date: data.date,
        depoPartyName: data.depoPartyName,
        email: data.email,
        contactNumber: data.contactNumber,
        invoiceNo: data.invoiceNo,
        invoiceDate: data.invoiceDate,
        lrNumber: data.lrNumber,
        transporterName: data.transporterName,
        transporterNumber: data.transporterNumber,
        complaintType: data.complaintType,
        salePersonName: data.salesPersonName, // Note: backend expects salePersonName
        productName: data.productName,
        areaOfConcern: data.areaOfConcern,
        subCategory: data.subCategory,
        voc: data.voiceOfCustomer, // Note: backend expects voc
        attachment: attachmentPath || (existingComplaint?.attachment || ''), // Keep existing attachment if no new one
        actionTaken: data.actionTaken,
        creditDate: data.creditDate,
        creditNoteNumber: data.creditNoteNumber,
        creditAmount: data.creditAmount,
        personResponsible: data.personResponsible,
        rootCauseActionPlan: data.rootCauseActionPlan,
        priority: existingComplaint?.priority || 'medium',
        status: existingComplaint?.status || 'new'
      };

      // Use appropriate endpoint and method based on edit mode
      const adminToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (adminToken) {
        headers['admin-authorization'] = adminToken;
      }

      if (isEditMode && complaintId) {
        // Update existing complaint
        return apiRequest(`/api/complaints/${complaintId}`, {
          method: 'PATCH',
          body: JSON.stringify(apiData),
          headers
        });
      } else {
        // Create new complaint
        return apiRequest('/api/complaints', {
          method: 'POST',
          body: JSON.stringify(apiData),
          headers
        });
      }
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setComplaintCode(data.complaintCode || data.id);
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/complaints/stats'] });
      toast({
        title: isEditMode ? "Complaint Updated Successfully!" : "Complaint Created Successfully!",
        description: isEditMode 
          ? `Complaint #${existingComplaint?.yearlySequenceNumber || complaintId} has been updated` 
          : `Complaint has been registered with ID: ${data.complaintCode || data.id}`,
      });
      
      if (isEditMode) {
        // Navigate back to complaints list after successful update
        setTimeout(() => setLocation('/admin/complaints'), 1500);
      }
    },
    onError: (error: any) => {
      toast({
        title: isEditMode ? "Update Failed" : "Creation Failed",
        description: error.message || (isEditMode ? "Failed to update complaint. Please try again." : "Failed to create complaint. Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 15MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      
      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = (data: ComplaintFormData) => {
    submitComplaintMutation.mutate(data);
  };

  // Show success message if submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Complaint Created Successfully!</CardTitle>
            <CardDescription>
              Your complaint has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              The complaint has been added to the system and is ready for processing.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation('/admin/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setComplaintCode('');
                  form.reset();
                  setSelectedFile(null);
                  setFilePreview(null);
                }} 
                className="w-full"
              >
                Create Another Complaint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? `Edit Complaint #${existingComplaint?.yearlySequenceNumber || complaintId}` : 'Create New Complaint'}
              </h1>
            </div>
            <NotificationIcon />
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="text-2xl font-semibold leading-none tracking-tight">New Complaint Registration</div>
              <div className="text-sm text-muted-foreground">
                Please fill out the required fields marked with (*) to create the complaint
              </div>
            </div>
            <div className="p-6 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 overflow-visible">
                {/* Customer Details Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="depoPartyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depo/Party Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter depo/party name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter email address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter 10 digit contact number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Complaint Location & Source Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complaint Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complaintSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complaint Source</FormLabel>
                          {field.value === 'custom-input' || (!COMPLAINT_SOURCES.includes(field.value) && field.value !== '') ? (
                            <FormControl>
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                                <div className="relative group">
                                  <Input
                                    value={field.value === 'custom-input' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Type your custom complaint source..."
                                    className="pr-20 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-sm group-hover:border-blue-300"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  >
                                    📋 Select
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 animate-in fade-in-0 duration-500 delay-150">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
                                  <span>Switch back to predefined options</span>
                                </div>
                              </div>
                            </FormControl>
                          ) : (
                            <Select onValueChange={(value) => {
                              if (value === 'Others') {
                                field.onChange('custom-input');
                              } else {
                                field.onChange(value);
                              }
                            }} value={COMPLAINT_SOURCES.includes(field.value) ? field.value : ''}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                  <SelectValue placeholder="Choose complaint source..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {COMPLAINT_SOURCES.map((source) => (
                                  <SelectItem key={source} value={source} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {source}
                                  </SelectItem>
                                ))}
                                <div className="border-t mx-2 my-1"></div>
                                <SelectItem value="Others" className="hover:bg-green-50 focus:bg-green-50 text-green-700 font-medium">
                                  ✏️ Type custom source
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="placeOfSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place of Supply</FormLabel>
                          {field.value === 'custom-input' || (!PLACE_OF_SUPPLY_OPTIONS.includes(field.value) && field.value !== '') ? (
                            <FormControl>
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                                <div className="relative group">
                                  <Input
                                    value={field.value === 'custom-input' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Type your custom place of supply..."
                                    className="pr-20 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-sm group-hover:border-blue-300"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  >
                                    📋 Select
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 animate-in fade-in-0 duration-500 delay-150">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
                                  <span>Switch back to predefined locations</span>
                                </div>
                              </div>
                            </FormControl>
                          ) : (
                            <Select onValueChange={(value) => {
                              if (value === 'Others') {
                                field.onChange('custom-input');
                              } else {
                                field.onChange(value);
                              }
                            }} value={PLACE_OF_SUPPLY_OPTIONS.includes(field.value) ? field.value : ''}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                  <SelectValue placeholder="Choose place of supply..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {PLACE_OF_SUPPLY_OPTIONS.map((place) => (
                                  <SelectItem key={place} value={place} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {place}
                                  </SelectItem>
                                ))}
                                <div className="border-t mx-2 my-1"></div>
                                <SelectItem value="Others" className="hover:bg-green-50 focus:bg-green-50 text-green-700 font-medium">
                                  ✏️ Type custom location
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="complaintReceivingLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complaint Receiving Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter complaint receiving location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        return (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), "PPP") : "Pick date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                    setOpen(false);
                                  }}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Product & Complaint Type Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complaintType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complaint Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select complaint type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPLAINT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="salesPersonName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salesperson Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter salesperson name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          {field.value === 'custom-input' || (!PRODUCT_NAMES.includes(field.value) && field.value !== '') ? (
                            <FormControl>
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                                <div className="relative group">
                                  <Input
                                    value={field.value === 'custom-input' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Type your custom product name..."
                                    className="pr-20 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-sm group-hover:border-blue-300"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  >
                                    📋 Select
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 animate-in fade-in-0 duration-500 delay-150">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
                                  <span>Switch back to predefined products</span>
                                </div>
                              </div>
                            </FormControl>
                          ) : (
                            <Select onValueChange={(value) => {
                              if (value === 'Others') {
                                field.onChange('custom-input');
                              } else {
                                field.onChange(value);
                              }
                            }} value={PRODUCT_NAMES.includes(field.value) ? field.value : ''}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                  <SelectValue placeholder="Choose product name..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {PRODUCT_NAMES.map((product) => (
                                  <SelectItem key={product} value={product} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {product}
                                  </SelectItem>
                                ))}
                                <div className="border-t mx-2 my-1"></div>
                                <SelectItem value="Others" className="hover:bg-green-50 focus:bg-green-50 text-green-700 font-medium">
                                  ✏️ Type custom product
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="areaOfConcern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area of Concern</FormLabel>
                          {field.value === 'custom-input' || (!AREA_OF_CONCERNS.includes(field.value) && field.value !== '') ? (
                            <FormControl>
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                                <div className="relative group">
                                  <Input
                                    value={field.value === 'custom-input' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Type your custom area of concern..."
                                    className="pr-20 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-sm group-hover:border-blue-300"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  >
                                    📋 Select
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 animate-in fade-in-0 duration-500 delay-150">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
                                  <span>Switch back to predefined concerns</span>
                                </div>
                              </div>
                            </FormControl>
                          ) : (
                            <Select onValueChange={(value) => {
                              if (value === 'Others') {
                                field.onChange('custom-input');
                              } else {
                                field.onChange(value);
                              }
                            }} value={AREA_OF_CONCERNS.includes(field.value) ? field.value : ''}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                  <SelectValue placeholder="Choose area of concern..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {AREA_OF_CONCERNS.map((area) => (
                                  <SelectItem key={area} value={area} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {area}
                                  </SelectItem>
                                ))}
                                <div className="border-t mx-2 my-1"></div>
                                <SelectItem value="Others" className="hover:bg-green-50 focus:bg-green-50 text-green-700 font-medium">
                                  ✏️ Type custom concern
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub Category</FormLabel>
                          {field.value === 'custom-input' || (!SUB_CATEGORIES.includes(field.value) && field.value !== '') ? (
                            <FormControl>
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                                <div className="relative group">
                                  <Input
                                    value={field.value === 'custom-input' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Type your custom sub category..."
                                    className="pr-20 transition-all duration-300 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-sm group-hover:border-blue-300"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  >
                                    📋 Select
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 animate-in fade-in-0 duration-500 delay-150">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse"></div>
                                  <span>Switch back to predefined categories</span>
                                </div>
                              </div>
                            </FormControl>
                          ) : (
                            <Select onValueChange={(value) => {
                              if (value === 'Others') {
                                field.onChange('custom-input');
                              } else {
                                field.onChange(value);
                              }
                            }} value={availableSubCategories.includes(field.value) ? field.value : ''} disabled={availableSubCategories.length === 0}>
                              <FormControl>
                                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                  <SelectValue placeholder={availableSubCategories.length === 0 ? "First select area of concern..." : "Choose sub category..."} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {availableSubCategories.map((subCat) => (
                                  <SelectItem key={subCat} value={subCat} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {subCat}
                                  </SelectItem>
                                ))}
                                {availableSubCategories.length > 0 && (
                                  <>
                                    <div className="border-t mx-2 my-1"></div>
                                    <SelectItem value="Others" className="hover:bg-green-50 focus:bg-green-50 text-green-700 font-medium">
                                      ✏️ Type custom category
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Invoice & Transport Details Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice & Transport Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter invoice number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        return (
                          <FormItem>
                            <FormLabel>Invoice Date</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), "PPP") : "Pick invoice date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                    setOpen(false);
                                  }}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lrNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LR Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter LR number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="transporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transporter Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter transporter name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="transporterNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transporter Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter 10 digit transporter number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complaint Description</h3>
                  <FormField
                    control={form.control}
                    name="voiceOfCustomer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voice of Customer</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Please provide a detailed description of the complaint..."
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Resolution Details Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resolution Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actionTaken"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Action Taken</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe the action taken to resolve this complaint..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="creditDate"
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        return (
                          <FormItem>
                            <FormLabel>Credit Date</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), "PPP") : "Pick credit date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                    setOpen(false);
                                  }}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="creditNoteNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Note Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter credit note number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="creditAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Amount</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter credit amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="personResponsible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person Responsible for Complaint</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter person responsible" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rootCauseActionPlan"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Root Cause / Action Plan</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe the root cause analysis and action plan..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
                  <div className="space-y-4">
                    <Label>Upload Supporting Document (Optional)</Label>
                    
                    {!selectedFile ? (
                      <div 
                        onClick={() => document.getElementById('attachment')?.click()}
                        className="relative border-2 border-dashed border-gray-300 hover:border-blue-400 focus-within:border-blue-500 transition-all duration-200 rounded-lg p-8 bg-gray-50 hover:bg-blue-50 cursor-pointer group"
                      >
                        <input
                          id="attachment"
                          type="file"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp4,.mov,.avi,.wmv,.webm"
                          className="hidden"
                        />
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900 group-hover:text-blue-900">
                              Drop files here or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                              JPG, PNG, PDF, DOC, DOCX, MP4, MOV, AVI, WMV, WEBM (Max 15MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* File Preview */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-900">{selectedFile.name}</span>
                                <span className="text-sm text-gray-500">
                                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              
                              {/* File Preview */}
                              {filePreview && (
                                <div className="mt-3">
                                  {selectedFile?.type.startsWith('image/') ? (
                                    <img 
                                      src={filePreview} 
                                      alt="Preview" 
                                      className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                                    />
                                  ) : selectedFile?.type.startsWith('video/') ? (
                                    <video 
                                      src={filePreview} 
                                      controls 
                                      className="max-w-full max-h-48 rounded-lg border border-gray-200 bg-gray-50"
                                    />
                                  ) : null}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        {/* Upload Another File Button */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('attachment')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Different File
                        </Button>
                        <input
                          id="attachment"
                          type="file"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp4,.mov,.avi,.wmv,.webm"
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Section */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/admin/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitComplaintMutation.isPending}
                    className="flex-1"
                  >
                    {submitComplaintMutation.isPending ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Complaint'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}