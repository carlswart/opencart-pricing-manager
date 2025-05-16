import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Store, CustomerGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Users, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// OpenCart customer group interface
interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

interface CustomerGroupMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
  customerGroups: OpenCartCustomerGroup[];
  onSuccess?: () => void;
}

export function CustomerGroupMappingModal({
  open,
  onOpenChange,
  store,
  customerGroups,
  onSuccess
}: CustomerGroupMappingModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mappings, setMappings] = useState<{[key: number]: number | null}>({});
  const [appCustomerGroups, setAppCustomerGroups] = useState<CustomerGroup[]>([]);
  
  // Fetch application customer groups
  useEffect(() => {
    const fetchCustomerGroups = async () => {
      try {
        const response = await fetch('/api/customer-groups');
        if (response.ok) {
          const groups = await response.json();
          setAppCustomerGroups(groups);
          
          // Initialize mappings with suggested/auto-detected values
          const initialMappings: {[key: number]: number | null} = {};
          customerGroups.forEach(ocGroup => {
            // Auto-detect mappings based on name similarity
            let suggestedGroupId = null;
            
            // Look for Depot groups (18% discount)
            if (ocGroup.name.toLowerCase().includes('depot')) {
              const depotGroup = groups.find((g: CustomerGroup) => parseFloat(g.discountPercentage) === 18);
              if (depotGroup) suggestedGroupId = depotGroup.id;
            }
            // Look for Namibia groups (26% discount)
            else if (ocGroup.name.toLowerCase().includes('namibia')) {
              const namibiaGroup = groups.find((g: CustomerGroup) => parseFloat(g.discountPercentage) === 26);
              if (namibiaGroup) suggestedGroupId = namibiaGroup.id;
            }
            
            initialMappings[ocGroup.customer_group_id] = suggestedGroupId;
          });
          
          setMappings(initialMappings);
        }
      } catch (error) {
        console.error("Failed to fetch customer groups:", error);
      }
    };
    
    if (open) {
      fetchCustomerGroups();
    }
  }, [open]);
  
  const handleMappingChange = (openCartGroupId: number, appGroupId: string) => {
    setMappings(prev => ({
      ...prev,
      [openCartGroupId]: appGroupId === "none" ? null : parseInt(appGroupId)
    }));
  };
  
  const handleSave = async () => {
    if (!store?.id) return;
    
    setIsLoading(true);
    try {
      const mappingsArray = Object.entries(mappings).map(([ocGroupId, appGroupId]) => ({
        storeId: store.id,
        opencartCustomerGroupId: parseInt(ocGroupId),
        customerGroupId: appGroupId,
        opencartCustomerGroupName: customerGroups.find(g => g.customer_group_id === parseInt(ocGroupId))?.name || ""
      }));
      
      const response = await apiRequest(
        "POST",
        "/api/customer-group-mappings",
        mappingsArray
      );
      
      if (response.ok) {
        toast({
          title: "Mappings saved",
          description: "Customer group mappings have been saved successfully"
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/customer-group-mappings'] });
        
        if (onSuccess) {
          onSuccess();
        }
        
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save mappings");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving mappings",
        description: error instanceof Error ? error.message : "An unknown error occurred"
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
            <Users className="h-5 w-5" />
            Map Customer Groups for {store?.name}
          </DialogTitle>
          <DialogDescription>
            Map OpenCart customer groups to your application's customer groups
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {customerGroups.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No customer groups found in the OpenCart store
            </div>
          ) : (
            customerGroups.map((group) => (
              <div key={group.customer_group_id} className="space-y-2 border-b pb-4 last:border-0">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">{group.name}</span>
                </div>
                {group.description && (
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                )}
                <div className="pt-1">
                  <Label htmlFor={`group-${group.customer_group_id}`} className="text-xs mb-1 block">
                    Map to application group:
                  </Label>
                  <Select
                    value={mappings[group.customer_group_id]?.toString() || "none"}
                    onValueChange={(value) => handleMappingChange(group.customer_group_id, value)}
                  >
                    <SelectTrigger id={`group-${group.customer_group_id}`}>
                      <SelectValue placeholder="Select a customer group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (No special pricing)</SelectItem>
                      {appCustomerGroups.map((appGroup) => (
                        <SelectItem key={appGroup.id} value={appGroup.id.toString()}>
                          {appGroup.name} ({appGroup.discountPercentage}% discount)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || customerGroups.length === 0}>
            {isLoading ? "Saving..." : "Save Mappings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}