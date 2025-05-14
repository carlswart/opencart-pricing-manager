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
import { Store as StoreIcon, Plus, CircleCheck, Trash } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl dark:bg-neutral-900 dark:border-neutral-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="dark:text-white">Database Connection Settings</DialogTitle>
          <div className="text-sm text-muted-foreground dark:text-neutral-400">
            Configure database connections for your OpenCart stores
          </div>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Connected Stores</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-primary text-sm hover:text-secondary dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-neutral-800"
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
                    <AccordionItem key={connection.id} value={`connection-${connection.id}`} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
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
                          <AccordionTrigger className="p-0" />
                        </div>
                      </div>
                      <AccordionContent>
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
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-neutral-700 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteConnection(connection.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete Connection
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                onClick={() => handleTestConnection(connection.id)}
                              >
                                Test Connection
                              </Button>
                              <Button
                                size="sm"
                                className="dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                                onClick={() => handleSaveConnection(connection.id)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
          
          {/* New connection form */}
          {showNewConnectionForm && (
            <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 font-medium text-sm dark:text-neutral-300">
                Add New Database Connection
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Select Store</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-neutral-800 flex items-center"
                      onClick={handleAddNewStore}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add New Store
                    </Button>
                  </div>
                  <select 
                    className="mt-1 w-full rounded-md border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 p-2"
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
                  {stores.filter(store => !connections.some(conn => conn.storeId === store.id)).length === 0 && (
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                      <span className="mr-2">All stores have connections. Add a new store to continue.</span>
                    </div>
                  )}
                </div>
                
                {newConnection && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Host</Label>
                        <Input 
                          value={newConnection.host} 
                          onChange={(e) => handleNewConnectionInputChange("host", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Port</Label>
                        <Input 
                          value={newConnection.port} 
                          onChange={(e) => handleNewConnectionInputChange("port", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Database Name</Label>
                        <Input 
                          value={newConnection.database} 
                          onChange={(e) => handleNewConnectionInputChange("database", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Table Prefix</Label>
                        <Input 
                          value={newConnection.prefix} 
                          onChange={(e) => handleNewConnectionInputChange("prefix", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Username</Label>
                        <Input 
                          value={newConnection.username} 
                          onChange={(e) => handleNewConnectionInputChange("username", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Password</Label>
                        <Input 
                          type="password" 
                          value={newConnection.password} 
                          onChange={(e) => handleNewConnectionInputChange("password", e.target.value)}
                          className="mt-1 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
                        className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={handleTestNewConnection}
                      >
                        Test Connection
                      </Button>
                      <Button
                        size="sm"
                        className="dark:bg-primary dark:text-white dark:hover:bg-primary/90"
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
        
        <DialogFooter className="dark:bg-neutral-900 border-t dark:border-neutral-800 px-4 py-3">
          <Button 
            onClick={() => onOpenChange(false)}
            className="dark:bg-primary dark:text-white dark:hover:bg-primary/90">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
