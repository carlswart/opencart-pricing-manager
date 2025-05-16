import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, DbConnection, CustomerGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Store as StoreIcon, Plus, CircleCheck, Trash, Database, Pencil, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// OpenCart customer group interface
interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

interface DatabaseSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  connections: DbConnection[];
  selectedStoreId?: number | null;
  onAddStore?: () => void;
}

export function DatabaseSettingsModal({
  open,
  onOpenChange,
  stores,
  connections,
  selectedStoreId,
  onAddStore
}: DatabaseSettingsModalProps) {
  const { toast } = useToast();
  const [editedConnections, setEditedConnections] = useState<DbConnection[]>([]);
  const [newConnection, setNewConnection] = useState<Partial<DbConnection> & { storeId: number } | null>(null);
  const [selectedStoreForNewConnection, setSelectedStoreForNewConnection] = useState<number | null>(null);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  
  // Reset form data when modal opens
  useEffect(() => {
    if (open) {
      // Make a deep copy of connections to avoid modifying the original
      setEditedConnections(JSON.parse(JSON.stringify(connections || [])));
      
      // If a specific store is selected for configuration
      if (selectedStoreId) {
        // Check if this store already has a connection
        const existingConnection = connections?.find(c => c.storeId === selectedStoreId);
        
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
    } else {
      // Reset state when modal closes
      setEditedConnections([]);
      setShowNewConnectionForm(false);
      setNewConnection(null);
      setSelectedStoreForNewConnection(null);
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
  
  const handleAddNewStore = async () => {
    const storeName = window.prompt("Enter store name:");
    if (!storeName) return;
    
    const storeUrl = window.prompt("Enter store URL (e.g., https://store.example.com):");
    if (!storeUrl) return;
    
    try {
      const result = await apiRequest(
        "POST",
        "/api/stores",
        { name: storeName, url: storeUrl }
      );
      
      // Parse the response to get the new store
      const newStore = await result.json();
      
      // Invalidate the stores query to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      
      toast({
        title: "Store created",
        description: "New store has been added successfully",
      });
      
      // Automatically select this store for connection configuration
      setSelectedStoreForNewConnection(newStore.id);
      setNewConnection({
        storeId: newStore.id,
        host: 'localhost',
        port: '3306',
        database: '',
        username: '',
        password: '',
        prefix: 'oc_'
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create store",
      });
    }
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
      
      const data = await response.json();
      
      let securityMessage = "";
      if (data.isSecure) {
        securityMessage = `\nSecure connection using ${data.securityDetails.cipher} (${data.securityDetails.version})`;
      } else {
        securityMessage = "\nWarning: Connection is not encrypted";
      }
      
      toast({
        title: "Connection successful",
        description: `Successfully connected to the database${securityMessage}`,
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
      const response = await apiRequest(
        "POST",
        "/api/database/test-connection",
        newConnection
      );
      
      const data = await response.json();
      
      let securityMessage = "";
      if (data.isSecure) {
        securityMessage = `\nSecure connection using ${data.securityDetails.cipher} (${data.securityDetails.version})`;
      } else {
        securityMessage = "\nWarning: Connection is not encrypted";
      }
      
      toast({
        title: "Connection successful",
        description: `Successfully connected to the database${securityMessage}`,
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
  
  const handleDeleteConnection = async (connectionId: number) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this connection? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest(
        "DELETE",
        `/api/database/connections/${connectionId}`,
        {}
      );
      
      // Invalidate the connections query to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      // Remove the deleted connection from the edited connections
      setEditedConnections(editedConnections.filter(conn => conn.id !== connectionId));
      
      toast({
        title: "Connection deleted",
        description: "Database connection has been successfully deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete database connection",
      });
    }
  };

  // Determine if we should show the connections list
  // We'll hide it when we're specifically adding a connection for a store that doesn't have one
  const shouldShowConnectionsList = !selectedStoreId || connections?.find(c => c.storeId === selectedStoreId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl dark:bg-neutral-900 dark:border-neutral-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="dark:text-white">Database Connection Settings</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground dark:text-neutral-400">
            Configure database connections for your OpenCart stores
          </DialogDescription>
        </DialogHeader>
        
        {/* Content area */}
        <div className="mb-6">
          {/* Only show connections list if NOT adding a connection for a store without one */}
          {shouldShowConnectionsList && (
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-neutral-800">
                <h3 className="text-base font-medium text-neutral-800 dark:text-white">Connected Stores</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center text-sm bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                  onClick={() => setShowNewConnectionForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Connection</span>
                </Button>
              </div>
              
              {/* Existing connections */}
              {editedConnections.length > 0 ? (
                <div className="space-y-4">
                  {editedConnections.map((connection) => {
                    const store = stores.find(s => s.id === connection.storeId);
                    return (
                      <div key={connection.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 dark:bg-opacity-20 dark:bg-blue-900/30 flex items-center justify-center text-primary dark:text-blue-400 mr-3">
                              <StoreIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{store?.name}</h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{store?.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center text-xs text-success dark:text-green-400 dark:bg-green-900/20 dark:px-2 dark:py-1 dark:rounded-full">
                              <CircleCheck className="h-3 w-3 mr-1" />
                              Connected
                            </span>
                          </div>
                        </div>
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Host</Label>
                              <Input 
                                value={connection.host} 
                                onChange={(e) => handleInputChange(connection.id, "host", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Port</Label>
                              <Input 
                                value={connection.port} 
                                onChange={(e) => handleInputChange(connection.id, "port", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Database Name</Label>
                              <Input 
                                value={connection.database} 
                                onChange={(e) => handleInputChange(connection.id, "database", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Table Prefix</Label>
                              <Input 
                                value={connection.prefix} 
                                onChange={(e) => handleInputChange(connection.id, "prefix", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Username</Label>
                              <Input 
                                value={connection.username} 
                                onChange={(e) => handleInputChange(connection.id, "username", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Password</Label>
                              <Input 
                                type="password" 
                                value={connection.password} 
                                onChange={(e) => handleInputChange(connection.id, "password", e.target.value)}
                                className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs dark:bg-neutral-800 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteConnection(connection.id)}
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
                                onClick={() => handleTestConnection(connection.id)}
                              >
                                <Database className="h-3 w-3 mr-1" />
                                Test Connection
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="text-xs bg-primary text-white hover:bg-primary/90 dark:bg-primary"
                                onClick={() => handleSaveConnection(connection.id)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !showNewConnectionForm && (
                <div className="text-center p-6 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No database connections configured</p>
                  <Button onClick={() => setShowNewConnectionForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Connection
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* New connection form */}
          {showNewConnectionForm && (
            <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800">
                <h3 className="text-base font-medium text-neutral-800 dark:text-white">
                  Add New Database Connection
                </h3>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Store</Label>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    <select
                      value={selectedStoreForNewConnection || ''}
                      onChange={(e) => handleStoreSelect(Number(e.target.value))}
                      className="w-full p-2 border border-neutral-200 rounded-md dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                      disabled={selectedStoreId !== undefined && selectedStoreId !== null}
                    >
                      <option value="">Select a store...</option>
                      {stores
                        .filter(store => !connections.some(c => c.storeId === store.id))
                        .map(store => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))
                      }
                    </select>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddStore || (() => {})}
                        className="text-xs dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New Store
                      </Button>
                    </div>
                  </div>
                </div>
                
                {selectedStoreForNewConnection && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Host</Label>
                        <Input 
                          value={newConnection?.host || ''} 
                          onChange={(e) => handleNewConnectionInputChange("host", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Port</Label>
                        <Input 
                          value={newConnection?.port || ''} 
                          onChange={(e) => handleNewConnectionInputChange("port", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Database Name</Label>
                        <Input 
                          value={newConnection?.database || ''} 
                          onChange={(e) => handleNewConnectionInputChange("database", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Table Prefix</Label>
                        <Input 
                          value={newConnection?.prefix || ''} 
                          onChange={(e) => handleNewConnectionInputChange("prefix", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Username</Label>
                        <Input 
                          value={newConnection?.username || ''} 
                          onChange={(e) => handleNewConnectionInputChange("username", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Password</Label>
                        <Input 
                          type="password" 
                          value={newConnection?.password || ''} 
                          onChange={(e) => handleNewConnectionInputChange("password", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        className="text-sm bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        onClick={() => {
                          setShowNewConnectionForm(false);
                          setNewConnection(null);
                          setSelectedStoreForNewConnection(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          className="text-sm bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                          onClick={handleTestNewConnection}
                        >
                          <Database className="h-4 w-4 mr-1" />
                          Test Connection
                        </Button>
                        <Button
                          variant="default"
                          className="text-sm bg-primary text-white hover:bg-primary/90 dark:bg-primary"
                          onClick={handleCreateConnection}
                        >
                          Create Connection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}