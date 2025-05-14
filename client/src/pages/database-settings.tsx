import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DatabaseSettingsModal } from "@/components/modals/database-settings-modal";
import { Store, DbConnection } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function DatabaseSettings() {
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
                          <Badge variant="outline" className="bg-success bg-opacity-10 text-success border-success border-opacity-30">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive bg-opacity-10 text-destructive border-destructive border-opacity-30">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleConfigureStore(store.id)}
                        >
                          Configure Connection
                        </Button>
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
