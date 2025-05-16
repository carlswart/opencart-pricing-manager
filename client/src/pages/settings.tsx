import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CircleDotDashed, Paintbrush } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { useColorTheme } from "@/hooks/use-color-theme";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  
  // General settings state
  const [companyName, setCompanyName] = useState("PriceSync Inc");
  const [contactEmail, setContactEmail] = useState("admin@pricesync.com");
  const [defaultCurrency, setDefaultCurrency] = useState("ZAR");
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceChangeAlerts, setPriceChangeAlerts] = useState(true);
  const [updateSummaries, setUpdateSummaries] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState(15); // Default 15 minutes
  const [loadingSessionTimeout, setLoadingSessionTimeout] = useState(false);
  
  // Fetch session timeout setting on component mount
  useEffect(() => {
    const fetchSessionTimeout = async () => {
      try {
        const response = await fetch('/api/settings/session');
        if (response.ok) {
          const data = await response.json();
          if (data.timeoutMinutes) {
            setSessionTimeout(data.timeoutMinutes);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session timeout setting:', error);
      }
    };
    
    fetchSessionTimeout();
  }, []);

  const handleSaveGeneral = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your general settings have been updated successfully.",
      });
    }, 800);
  };
  
  const handleSaveNotifications = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Notification preferences saved",
        description: "Your notification settings have been updated successfully.",
      });
    }, 800);
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
      });
      return;
    }
    
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    }, 800);
  };
  
  // Handle session timeout update
  const handleSaveSessionTimeout = async () => {
    if (sessionTimeout < 1 || sessionTimeout > 1440) {
      toast({
        variant: "destructive",
        title: "Invalid timeout value",
        description: "Session timeout must be between 1 and 1440 minutes (24 hours).",
      });
      return;
    }
    
    setLoadingSessionTimeout(true);
    
    try {
      const response = await fetch('/api/settings/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeoutMinutes: sessionTimeout }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update session timeout');
      }
      
      toast({
        title: "Session timeout updated",
        description: `All users will now be logged out after ${sessionTimeout} minutes of inactivity.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating session timeout",
        description: "There was a problem updating the session timeout setting.",
      });
    } finally {
      setLoadingSessionTimeout(false);
    }
  };
  
  // Handle color theme change
  const handleColorThemeChange = (value: string) => {
    const newColorTheme = value as "default" | "green";
    setColorTheme(newColorTheme);
    toast({
      title: "Color Theme Updated",
      description: `App color theme has been changed to ${newColorTheme === "default" ? "Blue" : "Green"}`,
    });
  };
  
  // Handle light/dark mode change
  const handleModeChange = (value: string) => {
    setTheme(value);
    toast({
      title: "Display Mode Updated",
      description: `App appearance has been set to ${value === "dark" ? "Dark" : value === "light" ? "Light" : "System"} mode`,
    });
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <PageHeader title="Settings" subtitle="Manage application preferences and account settings" />
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-currency">Default Currency</Label>
                <Input
                  id="default-currency"
                  value={defaultCurrency}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Currency is fixed to South African Rand (ZAR)
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-change-alerts">Price Change Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when prices are updated
                    </p>
                  </div>
                  <Switch
                    id="price-change-alerts"
                    checked={priceChangeAlerts}
                    onCheckedChange={setPriceChangeAlerts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="update-summaries">Update Summaries</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive summaries after batch updates
                    </p>
                  </div>
                  <Switch
                    id="update-summaries"
                    checked={updateSummaries}
                    onCheckedChange={setUpdateSummaries}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="error-alerts">Error Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about update failures
                    </p>
                  </div>
                  <Switch
                    id="error-alerts"
                    checked={errorAlerts}
                    onCheckedChange={setErrorAlerts}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Session Timeout Section */}
                {user?.role === 'admin' && (
                  <div className="border-b pb-6 mb-6">
                    <h3 className="text-lg font-medium mb-2">Session Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure how long users can remain inactive before being logged out
                    </p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="session-timeout"
                              type="number"
                              min="1"
                              max="1440"
                              value={sessionTimeout}
                              onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 15)}
                              className="max-w-[150px]"
                            />
                            <span className="text-sm text-muted-foreground">minutes</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Users will be automatically logged out after this period of inactivity (1-1440 minutes)
                          </p>
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            onClick={handleSaveSessionTimeout} 
                            disabled={loadingSessionTimeout}
                            variant="outline"
                          >
                            {loadingSessionTimeout ? 'Saving...' : 'Update Timeout'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              
                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <h3 className="text-lg font-medium mb-2">Change Password</h3>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="h-5">
                    {newPassword && confirmPassword && (
                      <div className="flex items-center text-sm space-x-1">
                        {newPassword === confirmPassword ? (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Display Mode</h3>
                <RadioGroup defaultValue={theme} value={theme} onValueChange={handleModeChange} className="grid grid-cols-3 gap-4">
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-100 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CircleDotDashed className="mb-3 h-6 w-6" />
                      Light Mode
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-slate-900 text-white p-4 hover:bg-slate-800 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CircleDotDashed className="mb-3 h-6 w-6" />
                      Dark Mode
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gradient-to-br from-white to-slate-900 text-black p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CircleDotDashed className="mb-3 h-6 w-6" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Theme</h3>
                <RadioGroup defaultValue={colorTheme} value={colorTheme} onValueChange={handleColorThemeChange} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="default" id="blue" className="peer sr-only" />
                    <Label
                      htmlFor="blue"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Paintbrush className="mb-3 h-6 w-6 text-blue-500" />
                      Blue Theme
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="green" id="green" className="peer sr-only" />
                    <Label
                      htmlFor="green"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Paintbrush className="mb-3 h-6 w-6 text-green-500" />
                      Green Theme
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}