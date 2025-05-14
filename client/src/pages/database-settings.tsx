import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, StoreIcon, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DatabaseSettingsModal } from "@/components/modals/database-settings-modal";
import { Store, DbConnection } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function DatabaseSettings() {
  const { toast } = useToast();
  const [dbSettingsModalOpen, setDbSettingsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  
  // Fetch stores
  const { data: stores, isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });
  
  // Fetch database connections
  const { data: connections, isLoading: connectionsLoading } = useQuery<DbConnection[]>({
    queryKey: ['/api/database/connections'],
  });
  
  const handleConfigureStore = (storeId: number) => {
    setSelectedStore(storeId);
    setDbSettingsModalOpen(true);
  };
  
  const handleAddStore = () => {
    setSelectedStore(null);
    setDbSettingsModalOpen(true);
  };
  
  const handleDeleteStore = async (storeId: number) => {
    // Check if the store has a database connection
    const hasConnection = connections?.some(conn => conn.storeId === storeId);
    
    // Confirm deletion with appropriate warning
    let confirmMessage = "Are you sure you want to delete this store?";
    if (hasConnection) {
      confirmMessage += " This will also delete any associated database connections.";
    }
    confirmMessage += " This action cannot be undone.";
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // First, delete any associated database connections
      if (hasConnection) {
        const connection = connections?.find(conn => conn.storeId === storeId);
        if (connection) {
          await apiRequest(
            "DELETE",
            `/api/database/connections/${connection.id}`,
            {}
          );
        }
      }
      
      // Then delete the store
      await apiRequest(
        "DELETE",
        `/api/stores/${storeId}`,
        {}
      );
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/database/connections'] });
      
      toast({
        title: "Store deleted",
        description: "The store and its associated connections have been removed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete store",
      });
    }
  };
  
  return (
    <div>
      <PageHeader
        title="Database Settings"
        description="Manage database connections for your OpenCart stores"
        actions={
          <Button onClick={handleAddStore}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Store
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="pt-6">
            {storesLoading || connectionsLoading ? (
              <div className="text-center py-10">Loading database connections...</div>
            ) : stores && stores.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-neutral-500 mb-4">No stores configured yet</p>
                <Button onClick={handleAddStore}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Store
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores?.map((store) => {
                  const connection = connections?.find(c => c.storeId === store.id);
                  return (
                    <div key={store.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="bg-neutral-50 p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mr-3">
                            <StoreIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-neutral-700">{store.name}</h3>
                            <p className="text-xs text-neutral-500">{store.url}</p>
                          </div>
                        </div>
                        {connection ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-2.5 py-0.5">
                            Connected
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-2.5 py-0.5">
                            Not Connected
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 border-t border-neutral-200">
                        <div className="grid grid-cols-2 gap-y-2 mb-4">
                          <div className="text-sm text-neutral-500">Host:</div>
                          <div className="text-sm">{connection?.host || "Not set"}</div>
                          
                          <div className="text-sm text-neutral-500">Database:</div>
                          <div className="text-sm">{connection?.database || "Not set"}</div>
                          
                          <div className="text-sm text-neutral-500">Prefix:</div>
                          <div className="text-sm">{connection?.prefix || "Not set"}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteStore(store.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleConfigureStore(store.id)}
                          >
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {stores && connections && (
        <DatabaseSettingsModal
          open={dbSettingsModalOpen}
          onOpenChange={setDbSettingsModalOpen}
          stores={stores}
          connections={connections}
          selectedStoreId={selectedStore}
        />
      )}
    </div>
  );
}
