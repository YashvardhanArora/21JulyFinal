import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Star, Upload, MessageSquare, CheckCircle, Lightbulb, Clock, Save, Smartphone, Zap, AlertCircle, ThumbsUp, Camera, FileText, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAsmAuth } from '@/hooks/use-asm-auth';
import { asmApiGet, asmApiPost } from '@/lib/asm-api';

interface CustomerUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Complaint {
  id: number;
  complaintCode?: string;
  complaintType: string;
  status: string;
  productName: string;
  createdAt: string;
  areaOfConcern?: string;
  placeOfSupply?: string;
  voc?: string;
}

interface FeedbackTemplate {
  id: string;
  name: string;
  rating: string;
  comments: string;
  category: string;
}

interface SmartSuggestion {
  type: 'positive' | 'improvement' | 'neutral';
  text: string;
  category: string;
}

const feedbackSchema = z.object({
  complaintCode: z.string().min(1, "Please select a complaint"),
  rating: z.string().min(1, "Please provide a rating"),
  comments: z.string().min(10, "Comments must be at least 10 characters long"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function CustomerFeedback() {
  const [, setLocation] = useLocation();
  const { user } = useAsmAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formProgress, setFormProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      complaintCode: '',
      rating: '',
      comments: '',
    },
  });



  // Offline support
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality
  const autoSave = useCallback(async (data: FeedbackFormData) => {
    if (isOffline) return;
    
    setIsAutoSaving(true);
    try {
      localStorage.setItem('feedback-draft', JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
        selectedFile: selectedFile?.name
      }));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [isOffline, selectedFile]);

  // Load saved draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('feedback-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.reset(draft);
        setLastSaved(new Date(draft.savedAt));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [form]);

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((value) => {
      const timer = setTimeout(() => {
        autoSave(value as FeedbackFormData);
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave]);

  // Calculate form progress
  useEffect(() => {
    const values = form.getValues();
    let progress = 0;
    if (values.complaintCode) progress += 25;
    if (values.rating) progress += 25;
    if (values.comments && values.comments.length >= 10) progress += 50;
    setFormProgress(progress);
  }, [form]);



  // Fetch user's complaints
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['/api/asm/my-complaints'],
    queryFn: () => asmApiGet<Complaint[]>('/api/asm/my-complaints'),
    enabled: !!user,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const feedbackData = {
        complaintCode: data.complaintCode,
        rating: data.rating,
        comments: data.comments,
        selectedFile: selectedFile?.name,
      };

      return asmApiPost('/api/asm/feedback', feedbackData);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      localStorage.removeItem('feedback-draft'); // Clear saved draft
      toast({
        title: "Feedback Submitted Successfully!",
        description: "Thank you for your valuable feedback. It helps us improve our service.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });



  // Smart validation
  const validateComments = (comments: string) => {
    if (comments.length < 10) return "Comments should be at least 10 characters";
    if (comments.length > 1000) return "Comments should not exceed 1000 characters";
    
    // Check for meaningful content
    const words = comments.trim().split(/\s+/);
    if (words.length < 3) return "Please provide more detailed feedback";
    
    return true;
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = (data: FeedbackFormData) => {
    // Additional validation
    const commentsValidation = validateComments(data.comments);
    if (commentsValidation !== true) {
      toast({
        title: "Validation Error",
        description: commentsValidation,
        variant: "destructive",
      });
      return;
    }
    
    submitFeedbackMutation.mutate(data);
  };

  const renderStars = (currentRating: string, isInteractive: boolean = false) => {
    const rating = parseInt(currentRating) || 0;
    const displayRating = isInteractive ? hoveredStar || rating : rating;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= displayRating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${isInteractive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={isInteractive ? () => form.setValue('rating', star.toString()) : undefined}
            onMouseEnter={isInteractive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={isInteractive ? () => setHoveredStar(0) : undefined}
          />
        ))}
        {isInteractive && (
          <span className="ml-2 text-sm text-gray-600">
            {displayRating > 0 ? `${displayRating} star${displayRating > 1 ? 's' : ''}` : 'Click to rate'}
          </span>
        )}
      </div>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Show success message if submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Feedback Submitted!</CardTitle>
            <CardDescription>
              Thank you for your valuable feedback. Your input helps us improve our service quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We appreciate you taking the time to share your experience with us.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation('/asm/dashboard')} className="w-full">
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                  setSelectedFile(null);
                }} 
                className="w-full"
              >
                Submit Another Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/asm/dashboard')}
                className="mr-4 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Submit Feedback
                  </h1>
                  <p className="text-sm text-gray-500">Share your experience with us</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Offline indicator */}
              {isOffline && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline Mode
                </Badge>
              )}
              
              {/* Auto-save status */}
              {lastSaved && (
                <div className="hidden md:flex items-center text-xs text-gray-500">
                  {isAutoSaving ? (
                    <>
                      <Save className="w-3 h-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Saved {formatRelativeTime(lastSaved)}
                    </>
                  )}
                </div>
              )}
              
              {/* Progress indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-xs text-gray-500">Progress</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{formProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar for Mobile */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Form Progress</span>
              <span className="text-sm text-gray-500">{formProgress}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </div>



          {/* Main Feedback Form */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-xl text-gray-900">
                    <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
                    Complaint Feedback
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
                    Share your experience and help us improve our service quality
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step 1: Complaint Selection */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <h3 className="text-lg font-semibold text-gray-900">Select Complaint</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="complaintCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Choose Complaint to Review *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const complaint = complaints?.find(c => (c.complaintCode || c.id.toString()) === value);
                          setSelectedComplaint(complaint || null);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-white">
                              <SelectValue placeholder="Select a complaint to provide feedback for" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoading ? (
                              <SelectItem value="loading" disabled>Loading complaints...</SelectItem>
                            ) : complaints && complaints.length > 0 ? (
                              complaints.map((complaint: Complaint) => (
                                <SelectItem key={complaint.id} value={complaint.complaintCode || complaint.id.toString()}>
                                  <div className="flex flex-col py-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">
                                        {complaint.complaintCode || `#${complaint.id}`}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {complaint.status}
                                      </Badge>
                                    </div>
                                    <span className="text-sm font-medium text-blue-600">
                                      {complaint.complaintType} - {complaint.productName}
                                    </span>
                                    {complaint.areaOfConcern && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {complaint.areaOfConcern} • {complaint.placeOfSupply}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-complaints" disabled>No complaints found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        
                        {/* Selected Complaint Preview */}
                        {selectedComplaint && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900">Selected Complaint Details</h4>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Type:</span> {selectedComplaint.complaintType}
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Product:</span> {selectedComplaint.productName}
                                  </p>
                                  {selectedComplaint.voc && (
                                    <p className="text-sm text-blue-700">
                                      <span className="font-medium">Issue:</span> {selectedComplaint.voc.slice(0, 100)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className={`ml-3 ${
                                selectedComplaint.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                selectedComplaint.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {selectedComplaint.status}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Step 2: Rating */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <h3 className="text-lg font-semibold text-gray-900">Rate Your Experience</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Overall Experience Rating *</FormLabel>
                        <FormControl>
                          <div className="py-4">
                            <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-3">How satisfied are you with the complaint resolution?</p>
                                {renderStars(field.value, true)}
                              </div>
                              
                              {/* Rating Labels */}
                              <div className="flex justify-between w-full text-xs text-gray-500 px-2">
                                <span>Poor</span>
                                <span>Fair</span>
                                <span>Good</span>
                                <span>Very Good</span>
                                <span>Excellent</span>
                              </div>
                              
                              {/* Rating Feedback */}
                              {field.value && (
                                <div className="text-center">
                                  <p className="text-sm font-medium text-blue-600">
                                    {field.value === '1' && 'We apologize for the poor experience. Your feedback will help us improve.'}
                                    {field.value === '2' && 'Thank you for your feedback. We appreciate your patience.'}
                                    {field.value === '3' && 'Thank you for your feedback. We strive to do better.'}
                                    {field.value === '4' && 'Great to hear you had a good experience!'}
                                    {field.value === '5' && 'Wonderful! Thank you for the excellent rating.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Step 3: Detailed Feedback */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Detailed Comments *</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Textarea
                              {...field}
                              placeholder="Please share your detailed feedback about the resolution process, service quality, communication, and your overall experience. Be specific about what worked well and what could be improved..."
                              rows={8}
                              className="resize-none bg-white text-base leading-relaxed"
                              style={{ minHeight: '120px' }}
                            />
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>
                                {field.value ? `${field.value.length}/1000 characters` : '0/1000 characters'}
                              </span>
                              <span>
                                {field.value && field.value.length >= 10 ? (
                                  <span className="text-green-600 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Minimum length met
                                  </span>
                                ) : (
                                  'Minimum 10 characters required'
                                )}
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Step 4: File Upload */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <h3 className="text-lg font-semibold text-gray-900">Additional Documents</h3>
                    <Badge variant="outline" className="text-xs bg-gray-50">Optional</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-base font-medium text-gray-700 mb-2 block">
                        Supporting Documents
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload screenshots, documents, or photos that support your feedback
                      </p>
                      
                      <div 
                        onClick={() => document.getElementById('feedback-attachment')?.click()}
                        className="relative border-2 border-dashed border-gray-300 hover:border-blue-400 focus-within:border-blue-500 transition-all duration-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-white cursor-pointer group"
                      >
                        <input
                          id="feedback-attachment"
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <div className="text-center">
                          <div className="relative">
                            <div className="p-4 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mx-auto w-fit">
                              <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <p className="text-lg font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                              {selectedFile ? (
                                <span className="flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                  {selectedFile.name}
                                </span>
                              ) : (
                                'Click to upload or drag files here'
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              PDF, DOC, DOCX, JPG, JPEG, PNG • Maximum 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-green-600">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile-optimized Submit Section */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-lg">
                  <div className="flex flex-col md:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/asm/dashboard')}
                      className="flex-1 h-12 text-base"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending || formProgress < 75}
                      className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitFeedbackMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting Feedback...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Feedback
                          {formProgress < 75 && (
                            <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                              {formProgress}%
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Progress indicator for mobile */}
                  <div className="mt-3 md:hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Form Completion</span>
                      <span className="text-xs text-gray-500">{formProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${formProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Smart tips */}
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      {isAutoSaving && <span className="text-blue-600">💾 Auto-saving...</span>}
                      {!isAutoSaving && lastSaved && <span>✅ Draft saved {formatRelativeTime(lastSaved)}</span>}
                      {isOffline && <span className="text-orange-600">📱 Working offline</span>}
                    </p>
                  </div>
                </div>
              </form>
            </Form>
            </CardContent>
          </Card>
          
          {/* Mobile floating action hint */}
          <div className="md:hidden fixed bottom-20 right-4 z-40">
            {formProgress >= 75 && (
              <div className="bg-blue-600 text-white px-3 py-2 rounded-full text-xs shadow-lg animate-pulse">
                Ready to submit!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}