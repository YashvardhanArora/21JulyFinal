import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function SettingsPage() {
  const [reportEmail, setReportEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");

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
    const loadData = async () => {
      try {
        // Load current email settings
        const emailRes = await fetch('/api/settings/email');
        const emailData = await emailRes.json();
        setReportEmail(emailData.reportEmail || "yashvardhanarorayt@gmail.com");
      } catch (error) {
        console.error('Failed to load settings:', error);
        setReportEmail("yashvardhanarorayt@gmail.com");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update local state when profile context changes
  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    
    // Extract username from email if it ends with the company domain
    if (profile.email && profile.email.endsWith(EMAIL_DOMAIN)) {
      setEmailUsername(profile.email.replace(EMAIL_DOMAIN, ""));
    } else {
      // Default to first name if email doesn't have company domain
      setEmailUsername(profile.firstName.toLowerCase() || "user");
    }
    

  }, [profile]);

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email: fullEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update the global profile context
      updateProfile({ firstName, lastName, email: fullEmail });
      
      toast({
        title: "Profile Updated",
        description: `Profile updated: ${firstName} ${lastName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const updateEmailSettings = async () => {
    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportEmail }),
      });

      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "Email report settings have been saved successfully",
        });
      } else {
        throw new Error('Failed to update email settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email settings",
        variant: "destructive"
      });
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress: reportEmail }),
      });

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: `Test email sent successfully to ${reportEmail}`,
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile, security, and report settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => {
                      console.log('First name changed to:', e.target.value);
                      setFirstName(e.target.value);
                    }}
                    className="focus:ring-0 focus:outline-none focus:border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="focus:ring-0 focus:outline-none focus:border-gray-300"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="flex">
                  <Input 
                    id="email" 
                    type="text" 
                    value={emailUsername}
                    onChange={(e) => handleEmailUsernameChange(e.target.value)}
                    placeholder="username"
                    className="flex-1 rounded-r-none focus:ring-0 focus:outline-none focus:border-gray-300"
                    maxLength={30}
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
                    <Input id="current-password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button>Change Password</Button>
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Daily Report Settings</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-email">Report Email Address</Label>
                    <Input 
                      id="report-email" 
                      type="email" 
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="Enter email for daily reports"
                      className="focus:ring-0 focus:outline-none focus:border-gray-300"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Daily reports will be automatically sent to this email address at 9:00 AM
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateEmailSettings}>
                      Update Email Settings
                    </Button>
                    <Button variant="outline" onClick={sendTestEmail}>
                      Send Test Email
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-2">Report Schedule</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Daily reports: 9:00 AM every day</p>
                  <p>• Includes: Complaint statistics, regional breakdown, Excel exports</p>
                  <p>• Contains: Performance metrics and analytics visualizations</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  📧 Automated daily reports are sent every day at 9:00 AM to the configured email address with comprehensive analytics and Excel attachments.
                </div>
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  ✅ SMTP Configuration: Connected to Brevo (smtp-relay.brevo.com)
                  <br />
                  Use the "Send Test Email" button to verify your email setup.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}