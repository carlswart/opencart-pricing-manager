import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Store } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CustomerGroupMappingModal } from "@/components/modals/customer-group-mapping-modal";
import { useToast } from "@/hooks/use-toast";
import { Pencil, RefreshCw } from "lucide-react";

interface CustomerGroupMappingsListProps {
  store: Store;
}

interface CustomerGroupMapping {
  id: number;
  storeId: number;
  store_id?: number;
  customerGroupId: number;
  externalGroupId: number;
  externalGroupName: string;
}

interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

export function CustomerGroupMappingsList({ store }: CustomerGroupMappingsListProps) {
  const { toast } = useToast();
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<OpenCartCustomerGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch existing mappings for this store
  const { data: mappings, isLoading, isError } = useQuery<CustomerGroupMapping[]>({
    queryKey: [`/api/customer-group-mappings/store/${store.id}`],
    // Using options to handle errors instead of onError
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Fetch local customer groups
  const { data: localGroups } = useQuery({
    queryKey: ['/api/customer-groups'],
  });
  
  // Fetch store connection
  const { data: connections } = useQuery({
    queryKey: ['/api/database/connections'],
  });
  
  const refreshCustomerGroups = async () => {
    setIsRefreshing(true);
    try {
      // Find connection for this store
      const connection = connections?.find(
        c => (c.storeId === store.id) || (c.store_id === store.id)
      );
      
      if (!connection) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No connection found for this store"
        });
        return;
      }
      
      // Test connection to fetch customer groups
      const response = await apiRequest(
        "POST",
        "/api/database/test-connection",
        {
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          prefix: connection.prefix,
          storeId: store.id
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.customerGroups?.length > 0) {
        setCustomerGroups(result.customerGroups);
        setShowMappingModal(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to retrieve customer groups from store database"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to get local group name by ID
  const getLocalGroupName = (id: number) => {
    const group = localGroups?.find(g => g.id === id);
    return group ? group.displayName || group.name : 'Unknown Group';
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading mappings...</div>;
  }
  
  if (isError) {
    return (
      <div className="flex justify-center flex-col items-center p-4">
        <div className="text-red-500 mb-2">Error loading mappings</div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCustomerGroups}
        >
          Configure Customer Groups
        </Button>
      </div>
    );
  }
  
  // Initialize mappings as empty array if undefined
  const groupMappings = mappings || [];
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Group Mappings</CardTitle>
              <CardDescription>
                Manage customer group mappings for {store.name}
              </CardDescription>
            </div>
            <Button 
              onClick={refreshCustomerGroups} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isRefreshing ? "Refreshing..." : "Update Mappings"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappings && mappings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local Group</TableHead>
                  <TableHead>Store Group</TableHead>
                  <TableHead>Group ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map(mapping => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {getLocalGroupName(mapping.customerGroupId)}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.externalGroupName}</TableCell>
                    <TableCell>{mapping.externalGroupId}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={refreshCustomerGroups}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No customer group mappings found. Click "Update Mappings" to configure.
            </div>
          )}
        </CardContent>
      </Card>
      
      {showMappingModal && (
        <CustomerGroupMappingModal
          open={showMappingModal}
          onOpenChange={setShowMappingModal}
          store={store}
          customerGroups={customerGroups}
          onSuccess={() => {
            toast({
              title: "Customer groups mapped",
              description: `Successfully mapped customer groups for ${store.name}`
            });
            // Refresh mappings data
            queryClient.invalidateQueries({ queryKey: [`/api/customer-group-mappings/store/${store.id}`] });
          }}
        />
      )}
    </div>
  );
}