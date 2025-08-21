import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function SettingsPage() {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { profile, updateProfile } = useUserProfile();

  const EMAIL_DOMAIN = "@bngroupindia.com";
  const fullEmail = emailUsername + EMAIL_DOMAIN;

  // Function to validate and clean email username input
  const handleEmailUsernameChange = (value: string) => {
    // Remove invalid characters: @, spaces, and other non-email characters
    let cleanValue = value
      .toLowerCase() // Convert to lowercase
      .replace(/[^a-z0-9._-]/g, '') // Only allow alphanumeric, dots, underscores, hyphens
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
      .replace(/[._-]{2,}/g, '_') // Replace multiple consecutive special chars with single underscore
      .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
    
    // Ensure minimum length and valid structure
    if (cleanValue.length > 0) {
      setEmailUsername(cleanValue);
    } else if (value === '') {
      setEmailUsername('');
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Update local state when profile context changes
  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setProfilePicture(profile.profilePicture || "");
    
    // Extract username from email if it ends with the company domain
    if (profile.email && profile.email.endsWith(EMAIL_DOMAIN)) {
      setEmailUsername(profile.email.replace(EMAIL_DOMAIN, ""));
    } else {
      // Default to first name if email doesn't have company domain
      setEmailUsername(profile.firstName.toLowerCase() || "user");
    }
    

  }, [profile]);

  const handleUpdateProfile = async () => {
    // Validate that both first name and last name are provided
    if (!firstName || !firstName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name is required",
        variant: "destructive"
      });
      return;
    }

    if (!lastName || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Last name is required",
        variant: "destructive"
      });
      return;
    }

    if (!emailUsername || !emailUsername.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: "destructive"
      });
      return;
    }

    // Trim whitespace from names
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName: trimmedFirstName, lastName: trimmedLastName, email: fullEmail, profilePicture }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update the global profile context
      updateProfile({ firstName: trimmedFirstName, lastName: trimmedLastName, email: fullEmail, profilePicture });
      
      toast({
        title: "Profile Updated",
        description: `Profile updated: ${trimmedFirstName} ${trimmedLastName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };



  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword || !securityKey) {
      toast({
        title: "Error",
        description: "Please fill in all fields including security key",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/admin/change-password-with-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword,
          securityKey 
        }),
      });

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSecurityKey("");
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
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
        handleUpdateProfile();
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and security settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-blue-100">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary text-white text-2xl font-medium">
                        {firstName && lastName ? (
                          <span>
                            {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
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
                    value={firstName}
                    onChange={(e) => {
                      console.log('First name changed to:', e.target.value);
                      setFirstName(e.target.value);
                    }}
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                <div className="flex">
                  <Input 
                    id="email" 
                    type="text" 
                    value={emailUsername}
                    onChange={(e) => handleEmailUsernameChange(e.target.value)}
                    placeholder="username"
                    className="flex-1 rounded-r-none focus:ring-0 focus:outline-none focus:border-gray-300"
                    maxLength={30}
                    required
                  />
                  <div className="flex items-center bg-gray-100 px-3 border border-l-0 rounded-r-md text-gray-600">
                    {EMAIL_DOMAIN}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Full email: {fullEmail}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Only letters, numbers, dots, hyphens, and underscores allowed. No spaces or @ symbol.
                </p>
              </div>
              

              
              <Button onClick={handleUpdateProfile}>Update Profile</Button>
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
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="security-key">Security Key</Label>
                    <Input 
                      id="security-key" 
                      type="text" 
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                      placeholder="Enter the 7 digit security key"
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact system administrator for security key
                    </p>
                  </div>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || !securityKey}
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}