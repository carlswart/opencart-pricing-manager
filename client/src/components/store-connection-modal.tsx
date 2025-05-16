import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Database, Store as StoreIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// OpenCart customer group interface
interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

interface StoreConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
  onSuccess?: (customerGroups?: OpenCartCustomerGroup[]) => void;
}

export function StoreConnectionModal({
  open,
  onOpenChange,
  store,
  onSuccess
}: StoreConnectionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: '3306',
    database: '',
    username: '',
    password: '',
    prefix: 'oc_'
  });
  
  // Get existing connection data for this store
  const { data: connections } = useQuery({
    queryKey: ['/api/database/connections'],
  });
  
  // Load existing connection data when modal opens
  useEffect(() => {
    if (open && store?.id && connections) {
      // Find existing connection for this store
      const existingConnection = connections.find(
        c => (c.storeId === store.id) || (c.store_id === store.id)
      );
      
      if (existingConnection) {
        // Pre-fill form with existing connection data
        setFormData({
          host: existingConnection.host || 'localhost',
          port: existingConnection.port || '3306',
          database: existingConnection.database || '',
          username: existingConnection.username || '',
          password: existingConnection.password || '',
          prefix: existingConnection.prefix || 'oc_'
        });
      }
    }
  }, [open, store, connections]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!store?.id) return;
    
    setIsLoading(true);
    try {
      // First test the connection
      const testResponse = await apiRequest(
        "POST",
        "/api/database/test-connection",
        {
          ...formData,
          storeId: store.id
        }
      );
      
      const testData = await testResponse.json();
      
      if (testData.success) {
        // Create the connection if test was successful
        const createResponse = await apiRequest(
          "POST",
          "/api/database/connections",
          {
            ...formData,
            storeId: store.id
          }
        );
        
        await createResponse.json();
        queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
        
        let securityMessage = "";
        if (testData.isSecure) {
          securityMessage = `\nSecure connection using ${testData.securityDetails.cipher}`;
        } else {
          securityMessage = "\nWarning: Connection is not encrypted";
        }
        
        toast({
          title: "Connection successful",
          description: `Successfully connected to ${store.name} database${securityMessage}`,
        });
        
        if (onSuccess && testData.customerGroups?.length > 0) {
          onSuccess(testData.customerGroups);
        }
        
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: testData.error || "Unable to connect to database",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect database"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            Connect Database for {store?.name}
          </DialogTitle>
          <DialogDescription>
            Enter the MySQL database details for this OpenCart store
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleFieldChange('host', e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={formData.port}
                onChange={(e) => handleFieldChange('port', e.target.value)}
                placeholder="3306"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="database">Database Name</Label>
            <Input
              id="database"
              value={formData.database}
              onChange={(e) => handleFieldChange('database', e.target.value)}
              placeholder="opencart"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                placeholder="root"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="********"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prefix">Table Prefix</Label>
            <Input
              id="prefix"
              value={formData.prefix}
              onChange={(e) => handleFieldChange('prefix', e.target.value)}
              placeholder="oc_"
            />
            <p className="text-xs text-muted-foreground">Usually "oc_" for OpenCart stores</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Database className="mr-2 h-4 w-4" />
            {isLoading ? "Connecting..." : "Connect Database"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}