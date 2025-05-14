import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  
  // General settings state
  const [companyName, setCompanyName] = useState("PriceSync Inc");
  const [contactEmail, setContactEmail] = useState("admin@pricesync.com");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceChangeAlerts, setPriceChangeAlerts] = useState(true);
  const [updateSummaries, setUpdateSummaries] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
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

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage application settings and preferences"
      />
      
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic application settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Input
                      id="defaultCurrency"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
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
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Receive general email notifications
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <Label>Price Change Alerts</Label>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Get notified when prices change significantly
                      </p>
                    </div>
                    <Switch 
                      checked={priceChangeAlerts}
                      onCheckedChange={setPriceChangeAlerts}
                      disabled={!emailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <Label>Update Summaries</Label>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Receive daily/weekly summaries of all updates
                      </p>
                    </div>
                    <Switch 
                      checked={updateSummaries}
                      onCheckedChange={setUpdateSummaries}
                      disabled={!emailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <Label>Error Alerts</Label>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Get immediate notifications about system errors
                      </p>
                    </div>
                    <Switch 
                      checked={errorAlerts}
                      onCheckedChange={setErrorAlerts}
                      disabled={!emailNotifications}
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
                <form onSubmit={handleChangePassword} className="space-y-6">
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
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      
                      {confirmPassword && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
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
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}