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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomerGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// OpenCart customer group interface from database
interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

interface CustomerGroupMapping {
  id: number;
  assignDiscount: boolean;
  discountPercentage: number;
}

interface CustomerGroupMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeInfo: { id: number; name: string } | null;
  customerGroups: OpenCartCustomerGroup[];
  onSave: (mappings: Record<number, { assignDiscount: boolean; discountPercentage: number }>) => Promise<void>;
}

export function CustomerGroupMappingModal({
  open,
  onOpenChange,
  storeInfo,
  customerGroups,
  onSave,
}: CustomerGroupMappingModalProps) {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<Record<number, CustomerGroupMapping>>({});
  const [saving, setSaving] = useState(false);

  // Initialize mappings whenever customer groups change
  useEffect(() => {
    const initialMappings: Record<number, CustomerGroupMapping> = {};
    
    customerGroups.forEach((group) => {
      // Auto-detect discounts based on group names
      let discountPercentage = 0;
      let assignDiscount = false;
      
      const lowerName = group.name.toLowerCase();
      
      // Auto-assign discounts based on name patterns
      if (lowerName.includes('depot')) {
        discountPercentage = 18;
        assignDiscount = true;
      } else if (lowerName.includes('namibia')) {
        discountPercentage = 26;
        assignDiscount = true;
      }
      
      initialMappings[group.customer_group_id] = {
        id: group.customer_group_id,
        assignDiscount,
        discountPercentage
      };
    });
    
    setMappings(initialMappings);
    
    // Try to fetch existing mappings from the API
    if (storeInfo) {
      apiRequest("GET", `/api/customer-groups/store-mappings/${storeInfo.id}`)
        .then(response => response.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            const existingMappings: Record<number, CustomerGroupMapping> = { ...initialMappings };
            
            data.forEach((mapping: any) => {
              if (existingMappings[mapping.customer_group_id]) {
                existingMappings[mapping.customer_group_id] = {
                  id: mapping.customer_group_id,
                  assignDiscount: mapping.assign_discount,
                  discountPercentage: mapping.discount_percentage
                };
              }
            });
            
            setMappings(existingMappings);
          }
        })
        .catch(error => {
          // If there are no mappings yet, the API might return a 404, which is fine
          console.log("No existing mappings found, using defaults");
        });
    }
  }, [customerGroups, storeInfo]);

  const handleAssignChange = (groupId: number, checked: boolean) => {
    setMappings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        assignDiscount: checked
      }
    }));
  };

  const handleDiscountChange = (groupId: number, value: string) => {
    const discountValue = parseFloat(value);
    
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return;
    }
    
    setMappings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        discountPercentage: discountValue
      }
    }));
  };

  const handleSave = async () => {
    if (!storeInfo) return;
    
    setSaving(true);
    
    try {
      // Format mappings for the API
      const mappingsForApi: Record<number, { assignDiscount: boolean; discountPercentage: number; name: string }> = {};
      
      Object.keys(mappings).forEach(key => {
        const groupId = parseInt(key);
        // Find the original customer group to get its name
        const originalGroup = customerGroups.find(g => g.customer_group_id === groupId);
        
        mappingsForApi[groupId] = {
          assignDiscount: mappings[groupId].assignDiscount,
          discountPercentage: mappings[groupId].discountPercentage,
          name: originalGroup?.name || 'Unknown Group'
        };
      });
      
      await onSave(mappingsForApi);
      
      toast({
        title: "Mappings saved",
        description: `Customer group mappings for ${storeInfo.name} have been saved.`
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save mappings",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Customer Group Mappings</DialogTitle>
          <DialogDescription>
            {storeInfo ? (
              <>Map customer groups from <span className="font-semibold">{storeInfo.name}</span> to special price discounts</>
            ) : (
              "Configure customer group discount mappings"
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-sm text-muted-foreground mb-4">
            <p>Customer groups from the OpenCart store are listed below. For each group, you can assign a discount percentage that will be applied when calculating special prices.</p>
            <p className="mt-2">Common defaults: Depots (18%), Namibia SD (26%)</p>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left font-medium">Group Name</th>
                  <th className="px-4 py-2 text-center font-medium">Apply Discount</th>
                  <th className="px-4 py-2 text-center font-medium">Discount Percentage</th>
                </tr>
              </thead>
              <tbody>
                {customerGroups.map((group) => (
                  <tr key={group.customer_group_id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-muted-foreground">{group.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={mappings[group.customer_group_id]?.assignDiscount || false}
                        onCheckedChange={(checked) => handleAssignChange(group.customer_group_id, checked)}
                      />
                    </td>
                    <td className="px-4 py-3 w-48">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          disabled={!mappings[group.customer_group_id]?.assignDiscount}
                          value={mappings[group.customer_group_id]?.discountPercentage || 0}
                          onChange={(e) => handleDiscountChange(group.customer_group_id, e.target.value)}
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Mappings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}