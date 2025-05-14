import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, DbConnection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Store as StoreIcon, Plus, CircleCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface DatabaseSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  connections: DbConnection[];
}

export function DatabaseSettingsModal({
  open,
  onOpenChange,
  stores,
  connections,
}: DatabaseSettingsModalProps) {
  const { toast } = useToast();
  const [editedConnections, setEditedConnections] = useState<DbConnection[]>([]);
  
  // Reset form data when modal opens
  useEffect(() => {
    if (open) {
      setEditedConnections(JSON.parse(JSON.stringify(connections)));
    }
  }, [open, connections]);

  const handleInputChange = (connectionId: number, field: keyof DbConnection, value: string) => {
    setEditedConnections(
      editedConnections.map((conn) =>
        conn.id === connectionId ? { ...conn, [field]: value } : conn
      )
    );
  };

  const handleTestConnection = async (connectionId: number) => {
    const connection = editedConnections.find((conn) => conn.id === connectionId);
    
    if (!connection) return;
    
    try {
      const response = await apiRequest(
        "POST",
        "/api/database/test-connection",
        connection
      );
      
      toast({
        title: "Connection successful",
        description: "Successfully connected to the database",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to the database",
      });
    }
  };

  const handleSaveConnection = async (connectionId: number) => {
    const connection = editedConnections.find((conn) => conn.id === connectionId);
    
    if (!connection) return;
    
    try {
      await apiRequest(
        "PUT",
        `/api/database/connections/${connectionId}`,
        connection
      );
      
      // Invalidate the connections query to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      toast({
        title: "Connection updated",
        description: "Database connection settings have been updated",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update database connection",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Database Connection Settings</DialogTitle>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-neutral-600">Connected Stores</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-primary text-sm hover:text-secondary"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add New Store</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            <Accordion type="multiple" className="w-full">
              {editedConnections.map((connection) => {
                const store = stores.find(s => s.id === connection.storeId);
                return (
                  <AccordionItem key={connection.id} value={`connection-${connection.id}`} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-neutral-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mr-3">
                          <StoreIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-neutral-600">{store?.name}</h4>
                          <p className="text-xs text-neutral-500">{store?.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-xs text-success">
                          <CircleCheck className="h-3 w-3 mr-1" />
                          Connected
                        </span>
                        <AccordionTrigger className="p-0" />
                      </div>
                    </div>
                    <AccordionContent>
                      <div className="p-4 border-t border-neutral-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Host</Label>
                            <Input 
                              value={connection.host} 
                              onChange={(e) => handleInputChange(connection.id, "host", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Port</Label>
                            <Input 
                              value={connection.port} 
                              onChange={(e) => handleInputChange(connection.id, "port", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Database Name</Label>
                            <Input 
                              value={connection.database} 
                              onChange={(e) => handleInputChange(connection.id, "database", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Table Prefix</Label>
                            <Input 
                              value={connection.prefix} 
                              onChange={(e) => handleInputChange(connection.id, "prefix", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Username</Label>
                            <Input 
                              value={connection.username} 
                              onChange={(e) => handleInputChange(connection.id, "username", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-neutral-500">Password</Label>
                            <Input 
                              type="password" 
                              value={connection.password} 
                              onChange={(e) => handleInputChange(connection.id, "password", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(connection.id)}
                          >
                            Test Connection
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveConnection(connection.id)}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
