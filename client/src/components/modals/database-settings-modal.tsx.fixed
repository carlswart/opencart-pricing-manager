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
import { CustomerGroupMappingModal } from "./customer-group-mapping-modal";

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
  const [newConnection, setNewConnection] = useState<Partial<DbConnection> & { store_id: number } | null>(null);
  const [selectedStoreForNewConnection, setSelectedStoreForNewConnection] = useState<number | null>(null);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("connection");
  
  // Customer group mapping state 
  const [retrievedCustomerGroups, setRetrievedCustomerGroups] = useState<OpenCartCustomerGroup[]>([]);
  const [showCustomerGroupMappingModal, setShowCustomerGroupMappingModal] = useState(false);
  const [selectedStoreForMapping, setSelectedStoreForMapping] = useState<{id: number; name: string} | null>(null);
  
  // Reset form data when modal opens
  useEffect(() => {
    if (open) {
      // Make a deep copy of connections to avoid modifying the original
      setEditedConnections(JSON.parse(JSON.stringify(connections || [])));
      
      // If a specific store is selected for configuration
      if (selectedStoreId) {
        const connection = connections.find(c => c.store_id === selectedStoreId);
        if (connection) {
          setNewConnection({
            ...connection,
            store_id: connection.store_id
          });
          setSelectedStoreForNewConnection(connection.store_id);
          setShowNewConnectionForm(true);
        }
      }
    }
  }, [open, connections, selectedStoreId]);
  
  const handleConnectionFieldChange = (connectionId: number, field: keyof DbConnection, value: string) => {
    setEditedConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId ? { ...conn, [field]: value } : conn
      )
    );
  };
  
  const handleCreateConnection = async () => {
    if (!newConnection) return;
    
    try {
      await apiRequest(
        "POST",
        "/api/database/connections",
        newConnection
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      toast({
        title: "Connection created",
        description: "Database connection has been created",
      });
      
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
  
  const handleTestConnection = async (connectionId: number) => {
    const connection = editedConnections.find((conn) => conn.id === connectionId);
    const store = stores.find(s => s.id === connection?.store_id);
    
    if (!connection || !store) return;
    
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
      
      // If customer groups were detected, save them and show the mapping modal
      if (data.customerGroups && Array.isArray(data.customerGroups) && data.customerGroups.length > 0) {
        setRetrievedCustomerGroups(data.customerGroups);
        setSelectedStoreForMapping({
          id: store.id,
          name: store.name
        });
        setShowCustomerGroupMappingModal(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to the database",
      });
    }
  };
  
  const handleUpdateConnection = async (connectionId: number) => {
    const connection = editedConnections.find((conn) => conn.id === connectionId);
    
    if (!connection) return;
    
    try {
      await apiRequest(
        "PUT",
        `/api/database/connections/${connectionId}`,
        connection
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      toast({
        title: "Connection updated",
        description: "Database connection has been updated",
      });
      
      // Test the connection after update
      handleTestConnection(connectionId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update database connection",
      });
    }
  };
  
  const handleDeleteConnection = async (connectionId: number) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }
    
    try {
      await apiRequest(
        "DELETE",
        `/api/database/connections/${connectionId}`
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      setEditedConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      toast({
        title: "Connection deleted",
        description: "Database connection has been deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete database connection",
      });
    }
  };
  
  const handleNewConnectionFieldChange = (field: keyof DbConnection, value: string) => {
    if (!newConnection) return;
    
    setNewConnection({
      ...newConnection,
      [field]: value
    });
  };
  
  const handleNewStoreWithConnection = async () => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/stores",
        {
          name: "New Store",
          url: "",
        }
      );
      
      const newStore = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      
      // Set up new connection for this store
      setShowNewConnectionForm(true);
      setSelectedStoreForNewConnection(newStore.id);
      setNewConnection({
        store_id: newStore.id,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Database Connections</DialogTitle>
            <DialogDescription>
              Configure and test database connections for your stores
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <Tabs defaultValue="connection" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="connection">Connections</TabsTrigger>
                <TabsTrigger value="stores">Stores</TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Store Database Connections</h3>
                    <div className="space-x-2">
                      <Button onClick={() => setShowNewConnectionForm(true)} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> New Connection
                      </Button>
                      <Button onClick={handleNewStoreWithConnection} variant="outline" size="sm">
                        <StoreIcon className="w-4 h-4 mr-1" /> New Store + Connection
                      </Button>
                    </div>
                  </div>
                  
                  {/* List existing connections */}
                  {editedConnections.length > 0 ? (
                    <div className="space-y-4">
                      {editedConnections.map((connection) => {
                        const store = stores.find(s => s.id === connection.store_id);
                        
                        return (
                          <div key={connection.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-md font-semibold flex items-center">
                                <StoreIcon className="w-5 h-5 mr-2" />
                                {store?.name || 'Unknown Store'}
                              </h4>
                              <div className="space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleTestConnection(connection.id)}
                                >
                                  <Database className="w-4 h-4 mr-1" /> Test
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateConnection(connection.id)}
                                >
                                  <CircleCheck className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteConnection(connection.id)}
                                >
                                  <Trash className="w-4 h-4 mr-1" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`host-${connection.id}`}>Host</Label>
                                <Input
                                  id={`host-${connection.id}`}
                                  value={connection.host}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'host', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`port-${connection.id}`}>Port</Label>
                                <Input
                                  id={`port-${connection.id}`}
                                  value={connection.port}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'port', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`database-${connection.id}`}>Database</Label>
                                <Input
                                  id={`database-${connection.id}`}
                                  value={connection.database}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'database', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`username-${connection.id}`}>Username</Label>
                                <Input
                                  id={`username-${connection.id}`}
                                  value={connection.username}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'username', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`password-${connection.id}`}>Password</Label>
                                <Input
                                  id={`password-${connection.id}`}
                                  type="password"
                                  value={connection.password}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'password', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`prefix-${connection.id}`}>Table Prefix</Label>
                                <Input
                                  id={`prefix-${connection.id}`}
                                  value={connection.prefix}
                                  onChange={(e) => handleConnectionFieldChange(connection.id, 'prefix', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No database connections configured yet</p>
                      <Button variant="outline" onClick={() => setShowNewConnectionForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Connection
                      </Button>
                    </div>
                  )}
                  
                  {/* New Connection Form */}
                  {showNewConnectionForm && (
                    <div className="border rounded-lg p-4 space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-semibold">New Connection</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setShowNewConnectionForm(false);
                            setNewConnection(null);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="store-select">Store</Label>
                          <select
                            id="store-select"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedStoreForNewConnection || ""}
                            onChange={(e) => {
                              const storeId = parseInt(e.target.value);
                              setSelectedStoreForNewConnection(storeId);
                              setNewConnection({
                                ...newConnection,
                                store_id: storeId
                              } as any);
                            }}
                          >
                            <option value="" disabled>Select a store</option>
                            {stores
                              .filter(store => {
                                // Filter out stores that already have connections unless it's the currently selected store
                                const hasConnection = connections.some(c => c.store_id === store.id);
                                return !hasConnection || (selectedStoreId && store.id === selectedStoreId);
                              })
                              .map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                              ))}
                          </select>
                        </div>
                        
                        {selectedStoreForNewConnection && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-host">Host</Label>
                                <Input
                                  id="new-host"
                                  value={newConnection?.host || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('host', e.target.value)}
                                  placeholder="localhost"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-port">Port</Label>
                                <Input
                                  id="new-port"
                                  value={newConnection?.port || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('port', e.target.value)}
                                  placeholder="3306"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-database">Database</Label>
                                <Input
                                  id="new-database"
                                  value={newConnection?.database || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('database', e.target.value)}
                                  placeholder="opencart"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-username">Username</Label>
                                <Input
                                  id="new-username"
                                  value={newConnection?.username || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('username', e.target.value)}
                                  placeholder="root"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password">Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newConnection?.password || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('password', e.target.value)}
                                  placeholder="********"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-prefix">Table Prefix</Label>
                                <Input
                                  id="new-prefix"
                                  value={newConnection?.prefix || ''}
                                  onChange={(e) => handleNewConnectionFieldChange('prefix', e.target.value)}
                                  placeholder="oc_"
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowNewConnectionForm(false);
                                  setNewConnection(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleCreateConnection}>
                                Create Connection
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stores">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Manage Stores</h3>
                    <Button onClick={onAddStore} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" /> New Store
                    </Button>
                  </div>
                  
                  {stores.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {stores.map((store) => {
                        const connection = connections.find(c => c.store_id === store.id);
                        
                        return (
                          <div key={store.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{store.name}</h4>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {store.url && (
                              <p className="text-sm text-muted-foreground mb-2">
                                URL: {store.url}
                              </p>
                            )}
                            
                            <div className="mt-2">
                              {connection ? (
                                <div className="flex items-center text-sm">
                                  <Database className="w-4 h-4 mr-1 text-green-500" />
                                  <span className="text-green-500">Connected</span>
                                  <span className="mx-2 text-muted-foreground">•</span>
                                  <span>{connection.host}:{connection.port}/{connection.database}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-sm">
                                  <Database className="w-4 h-4 mr-1 text-yellow-500" />
                                  <span className="text-yellow-500">No database connection</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No stores configured yet</p>
                      <Button variant="outline" onClick={onAddStore}>
                        <Plus className="w-4 h-4 mr-2" /> Add Store
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Customer Group Mapping Modal */}
      {showCustomerGroupMappingModal && (
        <CustomerGroupMappingModal
          open={showCustomerGroupMappingModal}
          onOpenChange={setShowCustomerGroupMappingModal}
          storeInfo={selectedStoreForMapping}
          customerGroups={retrievedCustomerGroups}
          onSave={async (mappings) => {
            if (!selectedStoreForMapping) return;
            
            try {
              // API call to save the mappings
              await apiRequest(
                "POST", 
                `/api/customer-groups/store-mappings/${selectedStoreForMapping.id}`,
                { mappings }
              );
              
              toast({
                title: "Mappings saved",
                description: `Customer group mappings for ${selectedStoreForMapping.name} have been saved`,
              });
              
              setShowCustomerGroupMappingModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/customer-groups/store-mappings'] });
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Failed to save mappings",
                description: error instanceof Error ? error.message : "An unknown error occurred",
              });
            }
          }}
        />
      )}
    </>
  );
}