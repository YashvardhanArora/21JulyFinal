import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Lock, 
  Upload, 
  CheckCircle, 
  Bell, 
  Shield, 
  Camera,
  Mail,
  Edit3,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Key,
  AlertCircle,
  Info,
  Trash2,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAsmAuth } from '@/hooks/use-asm-auth';
import { asmApiPost, asmApiPut } from '@/lib/asm-api';

interface CustomerUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});



type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;


export default function CustomerSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAsmAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileProgress, setProfileProgress] = useState(0);



  const { toast } = useToast();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });



  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.setValue('firstName', user.firstName);
      profileForm.setValue('lastName', user.lastName);
      profileForm.setValue('email', user.email);
      
      // Calculate profile completion
      const fields = [user.firstName, user.lastName, user.email];
      const completed = fields.filter(field => field && field.trim() !== '').length;
      setProfileProgress((completed / fields.length) * 100);
    }
  }, [user, profileForm]);

  // Watch form changes to update progress
  useEffect(() => {
    const subscription = profileForm.watch((values) => {
      const fields = [values.firstName, values.lastName, values.email];
      const completed = fields.filter(field => field && field.trim() !== '').length;
      setProfileProgress((completed / fields.length) * 100);
    });
    
    return () => subscription.unsubscribe();
  }, [profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return asmApiPut('/api/asm/profile', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Update user data in localStorage
      if (user && data && typeof data === 'object') {
        const profileData = data as ProfileFormData;
        const updatedUser = { 
          ...user, 
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email
        };
        localStorage.setItem('asmUser', JSON.stringify(updatedUser));
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return asmApiPost('/api/asm/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });







  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };





  if (!user) {
    return <div>Loading...</div>;
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
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
                  <p className="text-sm text-gray-500">Manage your profile and preferences</p>
                </div>
              </div>
            </div>
            
            {/* Profile Summary */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Profile {Math.round(profileProgress)}% complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Overview Card */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 bg-white shadow-md hover:shadow-lg"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {user?.email}
                    </p>

                  </div>
                </div>
                
                <div className="flex flex-col items-center md:items-end space-y-2">
                  <div className="text-center md:text-right">
                    <p className="text-sm font-medium text-gray-900">Profile Completion</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={profileProgress} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(profileProgress)}%
                      </span>
                    </div>
                  </div>
                  <Badge variant={profileProgress === 100 ? "default" : "secondary"} className="text-xs">
                    {profileProgress === 100 ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Settings Panel */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 bg-gray-50/50">
                  <TabsList className="w-full h-auto p-0 bg-transparent">
                    <div className="grid w-full grid-cols-2">
                      <TabsTrigger 
                        value="profile" 
                        className="flex flex-col items-center space-y-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
                      >
                        <User className="w-5 h-5" />
                        <span className="text-sm font-medium">Profile</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="security" 
                        className="flex flex-col items-center space-y-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">Security</span>
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </div>

              {/* Profile Tab */}
              <TabsContent value="profile" className="p-6 space-y-6">
                <div className="space-y-6">
                  {/* Profile Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-600">Update your personal details and contact information</p>
                      </div>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span className="text-xs">Required fields</span>
                      </Badge>
                    </div>

                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>First Name *</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field} 
                                      placeholder="Enter your first name"
                                      className="pl-4 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>Last Name *</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field} 
                                      placeholder="Enter your last name"
                                      className="pl-4 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-6">
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span>Email Address *</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field} 
                                      type="email" 
                                      placeholder="Enter your email address"
                                      className="pl-4 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />


                        </div>

                        <Separator />

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating Profile...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>


                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="p-6 space-y-6">
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                      </div>
                    </div>

                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Key className="w-4 h-4 text-gray-500" />
                                <span>Current Password *</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field} 
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter your current password"
                                    className="pl-4 pr-12 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  >
                                    {showCurrentPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <span>New Password *</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field} 
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter your new password (min 6 characters)"
                                    className="pl-4 pr-12 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                  >
                                    {showNewPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <span>Confirm New Password *</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field} 
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your new password"
                                    className="pl-4 pr-12 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Password Requirements:</p>
                              <ul className="space-y-1 text-xs">
                                <li>• Minimum 6 characters long</li>
                                <li>• Include both letters and numbers</li>
                                <li>• Use a unique password not used elsewhere</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={changePasswordMutation.isPending}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Changing Password...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>


                </div>
              </TabsContent>



              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}