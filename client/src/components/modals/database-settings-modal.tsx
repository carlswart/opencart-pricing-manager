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
  selectedStoreId?: number | null;
}

export function DatabaseSettingsModal({
  open,
  onOpenChange,
  stores,
  connections,
  selectedStoreId
}: DatabaseSettingsModalProps) {
  const { toast } = useToast();
  const [editedConnections, setEditedConnections] = useState<DbConnection[]>([]);
  const [newConnection, setNewConnection] = useState<Partial<DbConnection> & { storeId: number } | null>(null);
  const [selectedStoreForNewConnection, setSelectedStoreForNewConnection] = useState<number | null>(null);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  
  // Reset form data when modal opens
  useEffect(() => {
    if (open) {
      setEditedConnections(JSON.parse(JSON.stringify(connections)));
      
      // If a specific store is selected for configuration
      if (selectedStoreId) {
        // Check if this store already has a connection
        const existingConnection = connections.find(c => c.storeId === selectedStoreId);
        
        if (!existingConnection) {
          // Initialize new connection form for this store
          setSelectedStoreForNewConnection(selectedStoreId);
          setShowNewConnectionForm(true);
          setNewConnection({
            storeId: selectedStoreId,
            host: 'localhost',
            port: '3306',
            database: '',
            username: '',
            password: '',
            prefix: 'oc_'
          });
        }
      } else {
        setShowNewConnectionForm(false);
        setNewConnection(null);
        setSelectedStoreForNewConnection(null);
      }
    }
  }, [open, connections, selectedStoreId]);

  const handleInputChange = (connectionId: number, field: keyof DbConnection, value: string) => {
    setEditedConnections(
      editedConnections.map((conn) =>
        conn.id === connectionId ? { ...conn, [field]: value } : conn
      )
    );
  };
  
  const handleNewConnectionInputChange = (field: keyof DbConnection, value: string) => {
    if (newConnection) {
      setNewConnection({
        ...newConnection,
        [field]: value
      });
    }
  };
  
  const handleStoreSelect = (storeId: number) => {
    // Check if this store already has a connection
    const existingConnection = connections.find(c => c.storeId === storeId);
    
    if (existingConnection) {
      toast({
        variant: "destructive",
        title: "Connection exists",
        description: "This store already has a database connection configured."
      });
      return;
    }
    
    setSelectedStoreForNewConnection(storeId);
    setNewConnection({
      storeId,
      host: 'localhost',
      port: '3306',
      database: '',
      username: '',
      password: '',
      prefix: 'oc_'
    });
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
  
  const handleTestNewConnection = async () => {
    if (!newConnection) return;
    
    try {
      await apiRequest(
        "POST",
        "/api/database/test-connection",
        newConnection
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
  
  const handleCreateConnection = async () => {
    if (!newConnection) return;
    
    try {
      await apiRequest(
        "POST",
        "/api/database/connections",
        newConnection
      );
      
      // Invalidate the connections query to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      toast({
        title: "Connection created",
        description: "New database connection has been created",
      });
      
      // Reset new connection form
      setNewConnection(null);
      setSelectedStoreForNewConnection(null);
      setShowNewConnectionForm(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create database connection",
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
              onClick={() => setShowNewConnectionForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add New Connection</span>
            </Button>
          </div>
          
          {/* Existing connections */}
          <div className="space-y-4">
            {editedConnections.length > 0 ? (
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
            ) : !showNewConnectionForm && (
              <div className="text-center p-6 border border-dashed border-neutral-300 rounded-lg">
                <p className="text-neutral-500 mb-4">No database connections configured</p>
                <Button onClick={() => setShowNewConnectionForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Connection
                </Button>
              </div>
            )}
          </div>
          
          {/* New connection form */}
          {showNewConnectionForm && (
            <div className="mt-6 border border-neutral-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-neutral-50 font-medium text-sm">
                Add New Database Connection
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <Label className="text-xs font-medium text-neutral-500">Select Store</Label>
                  <select 
                    className="mt-1 w-full rounded-md border border-neutral-200 p-2"
                    value={selectedStoreForNewConnection || ""}
                    onChange={(e) => handleStoreSelect(Number(e.target.value))}
                  >
                    <option value="">Select a store</option>
                    {stores
                      .filter(store => !connections.some(conn => conn.storeId === store.id))
                      .map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))
                    }
                  </select>
                </div>
                
                {newConnection && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Host</Label>
                        <Input 
                          value={newConnection.host} 
                          onChange={(e) => handleNewConnectionInputChange("host", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Port</Label>
                        <Input 
                          value={newConnection.port} 
                          onChange={(e) => handleNewConnectionInputChange("port", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Database Name</Label>
                        <Input 
                          value={newConnection.database} 
                          onChange={(e) => handleNewConnectionInputChange("database", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Table Prefix</Label>
                        <Input 
                          value={newConnection.prefix} 
                          onChange={(e) => handleNewConnectionInputChange("prefix", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Username</Label>
                        <Input 
                          value={newConnection.username} 
                          onChange={(e) => handleNewConnectionInputChange("username", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500">Password</Label>
                        <Input 
                          type="password" 
                          value={newConnection.password} 
                          onChange={(e) => handleNewConnectionInputChange("password", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowNewConnectionForm(false);
                          setNewConnection(null);
                          setSelectedStoreForNewConnection(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestNewConnection}
                      >
                        Test Connection
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateConnection}
                      >
                        Create Connection
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
