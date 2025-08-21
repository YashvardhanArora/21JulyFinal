import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  profilePicture?: string;
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);



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
      setProfilePicture(user.profilePicture || null);
      
      // Remove profile completion calculation - per user request
    }
  }, [user, profileForm]);

  // Remove profile progress tracking - per user request
  useEffect(() => {
    const subscription = profileForm.watch((values) => {
      // Real-time name change updates will be handled in profile update mutation
    });
    
    return () => subscription.unsubscribe();
  }, [profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData & { profilePicture?: string }) => {
      return asmApiPut('/api/asm/profile', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Update user data in localStorage for real-time updates without page reload
      if (user && data && typeof data === 'object') {
        const responseData = data as any;
        if (responseData.user) {
          const updatedUser = { 
            ...user, 
            firstName: responseData.user.firstName,
            lastName: responseData.user.lastName,
            email: responseData.user.email,
            profilePicture: responseData.user.profilePicture
          };
          localStorage.setItem('asmUser', JSON.stringify(updatedUser));
          
          // Update profile picture in state for immediate visual feedback
          setProfilePicture(responseData.user.profilePicture || null);
          
          // Trigger a custom event to update sidebar in real-time
          window.dispatchEvent(new CustomEvent('asmUserUpdated', { 
            detail: updatedUser 
          }));
        }
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







  const onProfileSubmit = () => {
    const data: ProfileFormData = {
      firstName: profileForm.watch('firstName'),
      lastName: profileForm.watch('lastName'),
      email: profileForm.watch('email'),
    };
    updateProfileMutation.mutate({
      ...data,
      profilePicture: profilePicture || user?.profilePicture
    });
  };

  const onPasswordSubmit = () => {
    const data: PasswordFormData = {
      currentPassword: passwordForm.watch('currentPassword'),
      newPassword: passwordForm.watch('newPassword'),
      confirmPassword: passwordForm.watch('confirmPassword'),
    };
    
    // Validate password confirmation
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate(data);
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfilePicture(result);
        
        // Update profile with new picture immediately
        updateProfileMutation.mutate({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          profilePicture: result
        });
      };
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
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

                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {profilePicture || user?.profilePicture ? (
                        <img 
                          src={profilePicture || user?.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-primary text-white text-2xl font-medium">
                          {user?.firstName && user?.lastName ? (
                            <span>
                              {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <User className="w-8 h-8" />
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute bottom-0 right-0">
                      <Label htmlFor="profile-upload" className="cursor-pointer">
                        <div className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                          <Camera className="w-4 h-4" />
                        </div>
                      </Label>
                      <Input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="firstName" 
                      value={profileForm.watch('firstName')}
                      onChange={(e) => profileForm.setValue('firstName', e.target.value)}
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="lastName" 
                      value={profileForm.watch('lastName')}
                      onChange={(e) => profileForm.setValue('lastName', e.target.value)}
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  <span className="text-red-500">*</span> First name, last name, and email address are required fields. Your profile avatar will show the first letters of your names.
                </p>
                
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileForm.watch('email')}
                    onChange={(e) => profileForm.setValue('email', e.target.value)}
                    placeholder="Enter your email address"
                    className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    required
                  />
                </div>
                
                <Button onClick={onProfileSubmit} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="current-password" 
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.watch('currentPassword')}
                          onChange={(e) => passwordForm.setValue('currentPassword', e.target.value)}
                          className="focus:ring-0 focus:outline-none focus:border-gray-300 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="new-password" 
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.watch('newPassword')}
                          onChange={(e) => passwordForm.setValue('newPassword', e.target.value)}
                          className="focus:ring-0 focus:outline-none focus:border-gray-300 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input 
                          id="confirm-password" 
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.watch('confirmPassword')}
                          onChange={(e) => passwordForm.setValue('confirmPassword', e.target.value)}
                          className="focus:ring-0 focus:outline-none focus:border-gray-300 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={onPasswordSubmit}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}