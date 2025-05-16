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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Users, Check, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// OpenCart customer group interface
export interface OpenCartCustomerGroup {
  customer_group_id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

interface CustomerGroupMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: number;
  storeName: string;
  customerGroups: OpenCartCustomerGroup[];
  onSave: (mappings: Record<number, { assignDiscount: boolean; discountPercentage: number }>) => void;
  onCancel: () => void;
}

export function CustomerGroupMappingModal({
  open,
  onOpenChange,
  storeId,
  storeName,
  customerGroups,
  onSave,
  onCancel
}: CustomerGroupMappingModalProps) {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<Record<number, {
    assignDiscount: boolean;
    discountPercentage: number;
    name: string;
  }>>({});

  // Initialize mappings with default values, auto-detecting special groups
  useEffect(() => {
    if (open && customerGroups.length > 0) {
      const initialMappings: Record<number, {
        assignDiscount: boolean;
        discountPercentage: number;
        name: string;
      }> = {};
      
      customerGroups.forEach(group => {
        const lowerName = group.name.toLowerCase();
        
        // Auto-detect common customer groups and suggest discount percentages
        let assignDiscount = false;
        let discountPercentage = 0;
        
        if (lowerName.includes('depot')) {
          assignDiscount = true;
          discountPercentage = 18;
        } else if (lowerName.includes('namibia') || lowerName.includes('sd')) {
          assignDiscount = true;
          discountPercentage = 26;
        }
        
        initialMappings[group.customer_group_id] = {
          assignDiscount,
          discountPercentage,
          name: group.name
        };
      });
      
      setMappings(initialMappings);
    }
  }, [open, customerGroups]);

  const handleToggleDiscount = (groupId: number) => {
    setMappings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        assignDiscount: !prev[groupId].assignDiscount
      }
    }));
  };

  const handleDiscountChange = (groupId: number, value: string) => {
    const discountPercentage = parseFloat(value);
    if (isNaN(discountPercentage)) return;
    
    setMappings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        discountPercentage
      }
    }));
  };

  const handleSave = () => {
    onSave(mappings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl dark:bg-neutral-900 dark:border-neutral-700">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Users className="h-5 w-5 text-primary" />
            Customer Group Mapping
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground dark:text-neutral-400">
            Map OpenCart customer groups from {storeName} to discount percentages
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-2 p-3 bg-blue-50 border border-blue-100 rounded-md dark:bg-blue-900/20 dark:border-blue-800/50">
          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              When special pricing is calculated, each customer group with a discount assigned
              will receive the specified percentage off the regular price. The system has auto-detected
              some potential special pricing groups based on their names.
            </span>
          </p>
        </div>
        
        <Table>
          <TableCaption>Customer groups found in {storeName}'s OpenCart database</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">OpenCart Group</TableHead>
              <TableHead className="w-[150px] text-center">Apply Discount</TableHead>
              <TableHead>Discount Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerGroups.map((group) => (
              <TableRow key={group.customer_group_id}>
                <TableCell className="font-medium">
                  {group.name}
                  {group.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">{group.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={mappings[group.customer_group_id]?.assignDiscount || false}
                    onCheckedChange={() => handleToggleDiscount(group.customer_group_id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      disabled={!mappings[group.customer_group_id]?.assignDiscount}
                      value={mappings[group.customer_group_id]?.discountPercentage || 0}
                      onChange={(e) => handleDiscountChange(group.customer_group_id, e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    
                    {mappings[group.customer_group_id]?.assignDiscount && 
                     mappings[group.customer_group_id]?.discountPercentage > 0 && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-white hover:bg-primary/90 dark:bg-primary"
          >
            Save Mappings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}