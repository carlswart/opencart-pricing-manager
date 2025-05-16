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
  
  // Define types for customer groups
  type CustomerGroup = {
    id: number;
    name: string;
    displayName: string;
    discountPercentage: number;
    createdAt: string;
  };
  
  // Customer group state
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<CustomerGroup | null>(null);
  const [newCustomerGroup, setNewCustomerGroup] = useState({
    name: "",
    displayName: "",
    discountPercentage: 0
  });
  const [loadingCustomerGroups, setLoadingCustomerGroups] = useState(false);
  const [savingCustomerGroup, setSavingCustomerGroup] = useState(false);
  
  // Define types for stores and mappings
  type Store = {
    id: number;
    name: string;
    url: string;
    active: boolean;
    createdAt: string;
  };
  
  type StoreMapping = {
    id: number;
    storeId: number;
    customerGroupId: number;
    opencartCustomerGroupId: number;
    opencartCustomerGroupName: string;
    createdAt: string;
  };
  
  // Store customer group mapping state
  const [stores, setStores] = useState<Store[]>([]);
  const [storeMappings, setStoreMappings] = useState<Record<number, StoreMapping[]>>({});
  const [loadingStoreMappings, setLoadingStoreMappings] = useState(false);
  const [savingStoreMapping, setSavingStoreMapping] = useState(false);
  
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
  
  // Fetch customer groups
  useEffect(() => {
    const fetchCustomerGroups = async () => {
      setLoadingCustomerGroups(true);
      try {
        const response = await fetch('/api/customer-groups');
        if (response.ok) {
          const data = await response.json();
          setCustomerGroups(data);
        } else {
          toast({
            title: "Error fetching customer groups",
            description: "Failed to load customer groups. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching customer groups:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading customer groups.",
          variant: "destructive"
        });
      } finally {
        setLoadingCustomerGroups(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchCustomerGroups();
    }
  }, [user, toast]);
  
  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    
    if (user?.role === 'admin') {
      fetchStores();
    }
  }, [user]);

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
  // Create/update customer group
  const handleSaveCustomerGroup = async () => {
    setSavingCustomerGroup(true);
    try {
      let response;
      let group = selectedCustomerGroup ? { ...selectedCustomerGroup, ...newCustomerGroup } : newCustomerGroup;
      
      // Validate input
      if (!group.name) {
        toast({
          title: "Validation Error",
          description: "Internal name is required",
          variant: "destructive"
        });
        setSavingCustomerGroup(false);
        return;
      }
      
      if (!group.displayName) {
        toast({
          title: "Validation Error",
          description: "Display name is required",
          variant: "destructive"
        });
        setSavingCustomerGroup(false);
        return;
      }
      
      if (isNaN(group.discountPercentage) || group.discountPercentage < 0 || group.discountPercentage > 100) {
        toast({
          title: "Validation Error",
          description: "Discount percentage must be between 0 and 100",
          variant: "destructive"
        });
        setSavingCustomerGroup(false);
        return;
      }
      
      if (selectedCustomerGroup) {
        // Update existing group
        response = await fetch(`/api/customer-groups/${selectedCustomerGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(group)
        });
      } else {
        // Create new group
        response = await fetch('/api/customer-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(group)
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        
        // Update the list of customer groups
        setCustomerGroups(groups => {
          if (selectedCustomerGroup) {
            return groups.map(g => g.id === data.id ? data : g);
          } else {
            return [...groups, data];
          }
        });
        
        // Reset form
        setSelectedCustomerGroup(null);
        setNewCustomerGroup({
          name: "",
          displayName: "",
          discountPercentage: 0
        });
        
        toast({
          title: "Success",
          description: selectedCustomerGroup ? "Customer group updated successfully" : "Customer group created successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save customer group",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving customer group:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the customer group",
        variant: "destructive"
      });
    } finally {
      setSavingCustomerGroup(false);
    }
  };
  
  // Delete customer group
  const handleDeleteCustomerGroup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer group? This may affect pricing calculations.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customer-groups/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Update the list of customer groups
        setCustomerGroups(groups => groups.filter(g => g.id !== id));
        
        toast({
          title: "Success",
          description: "Customer group deleted successfully"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete customer group",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting customer group:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the customer group",
        variant: "destructive"
      });
    }
  };
  
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
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="customer-groups">Customer Groups</TabsTrigger>
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
        
        <TabsContent value="customer-groups">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Group Management Form */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedCustomerGroup ? "Edit Customer Group" : "Add Customer Group"}</CardTitle>
                <CardDescription>
                  {selectedCustomerGroup 
                    ? "Modify this customer group's settings" 
                    : "Create a new customer group with a discount rate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Internal Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., depot, namibiaSD"
                      value={newCustomerGroup.name}
                      onChange={(e) => setNewCustomerGroup({
                        ...newCustomerGroup,
                        name: e.target.value
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Unique internal name used in the system (no spaces, lowercase)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="e.g., Depots, Namibia SD"
                      value={newCustomerGroup.displayName}
                      onChange={(e) => setNewCustomerGroup({
                        ...newCustomerGroup,
                        displayName: e.target.value
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Human-readable name shown in the interface
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={newCustomerGroup.discountPercentage}
                        onChange={(e) => setNewCustomerGroup({
                          ...newCustomerGroup,
                          discountPercentage: parseFloat(e.target.value)
                        })}
                      />
                      <span>%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Percentage discount applied to regular prices (0-100)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCustomerGroup(null);
                        setNewCustomerGroup({
                          name: "",
                          displayName: "",
                          discountPercentage: 0
                        });
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleSaveCustomerGroup}
                      disabled={savingCustomerGroup}
                    >
                      {savingCustomerGroup ? "Saving..." : (selectedCustomerGroup ? "Update" : "Create")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Groups List */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Groups</CardTitle>
                <CardDescription>
                  Manage discount groups for different customer categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCustomerGroups ? (
                  <div className="text-center py-4">
                    <CircleDotDashed className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading customer groups...</p>
                  </div>
                ) : customerGroups.length === 0 ? (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <p className="text-muted-foreground mb-2">No customer groups found</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first customer group to start configuring discounts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerGroups.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/10 transition-colors">
                        <div>
                          <h3 className="font-medium">{group.displayName}</h3>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{group.name}</code>
                            <span className="text-sm font-medium text-green-600">
                              {group.discountPercentage}% discount
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomerGroup(group);
                              setNewCustomerGroup({
                                name: group.name,
                                displayName: group.displayName,
                                discountPercentage: group.discountPercentage
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            onClick={() => handleDeleteCustomerGroup(group.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}