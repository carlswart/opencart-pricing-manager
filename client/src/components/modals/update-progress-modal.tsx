import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock, AlertCircle } from "lucide-react";

interface StoreProgress {
  id: number;
  name: string;
  progress: number;
}

interface UpdateDetail {
  id: number;
  storeId: number;
  updateId: number;
  productId: number;
  sku: string;
  status: string;
  // Original format fields
  oldPrice?: number | null;
  newPrice?: number | null;
  oldQuantity?: number | null;
  newQuantity?: number | null;
  // New detailed format fields
  oldRegularPrice?: number | null;
  newRegularPrice?: number | null;
  oldDepotPrice?: number | null;
  newDepotPrice?: number | null;
  oldWarehousePrice?: number | null;
  newWarehousePrice?: number | null;
  // Additional fields
  name?: string;
  model?: string;
  store?: string;
}

interface UpdateProgressModalProps {
  open: boolean;
  progress: {
    status?: string;
    totalItems?: number;
    processedItems?: number;
    successCount?: number;
    errorCount?: number;
    updateDetails?: UpdateDetail[];
    // Keep original format for backward compatibility
    overall?: number;
    stores?: StoreProgress[];
  };
  onCancel: () => void;
}

export function UpdateProgressModal({
  open,
  progress,
  onCancel,
}: UpdateProgressModalProps) {
  // Determine the current progress percentage
  const progressPercentage = progress.status === 'completed' ? 100 : 
    progress.totalItems && progress.processedItems
      ? Math.round((progress.processedItems / progress.totalItems) * 100)
      : progress.overall || 0;
  
  // Create a stores array if we have update details but no stores
  const storesList = progress.stores || [];
  
  const getStatusMessage = () => {
    if (progress.status === 'completed' || progressPercentage === 100) {
      return "Update complete! All stores have been updated successfully.";
    } else if (progressPercentage === 0) {
      return "Preparing to update stores...";
    } else {
      return "Processing product updates, please wait...";
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {progressPercentage < 100 && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            Updating Store Prices
          </DialogTitle>
          <DialogDescription>
            This process may take several minutes. Please do not close this window.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600 flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" /> Overall Progress
            </span>
            <span className="text-sm text-neutral-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-4" />
          {progressPercentage > 0 && progressPercentage < 100 && (
            <p className="text-xs text-muted-foreground mt-1">
              Processing... {progress.processedItems || 0} of {progress.totalItems || '?'} items
            </p>
          )}
        </div>
        
        {storesList.length > 0 && (
          <div className="space-y-4">
            {storesList.map((store) => (
              <div key={store.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">{store.name}</span>
                  <span className="text-sm text-neutral-600">{store.progress}%</span>
                </div>
                <Progress value={store.progress} className="h-3" />
              </div>
            ))}
          </div>
        )}
        
        {progress.updateDetails && progress.updateDetails.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-neutral-600">Update Details</h4>
            <div className="max-h-48 overflow-y-auto rounded border p-2">
              {progress.updateDetails.map((detail) => (
                <div key={detail.id} className="text-xs py-1.5 border-b last:border-0">
                  <div className="font-medium mb-0.5">SKU: {detail.sku}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {/* Regular Price */}
                    {detail.oldRegularPrice !== undefined && detail.newRegularPrice !== undefined && (
                      <div className={detail.oldRegularPrice !== detail.newRegularPrice ? "text-primary" : ""}>
                        Regular: R {detail.oldRegularPrice} → R {detail.newRegularPrice}
                      </div>
                    )}
                    
                    {/* Depot Price */}
                    {detail.oldDepotPrice !== undefined && detail.newDepotPrice !== undefined && (
                      <div className={detail.oldDepotPrice !== detail.newDepotPrice ? "text-primary" : ""}>
                        Depot: R {detail.oldDepotPrice} → R {detail.newDepotPrice}
                      </div>
                    )}
                    
                    {/* Warehouse Price */}
                    {detail.oldWarehousePrice !== undefined && detail.newWarehousePrice !== undefined && (
                      <div className={detail.oldWarehousePrice !== detail.newWarehousePrice ? "text-primary" : ""}>
                        Warehouse: R {detail.oldWarehousePrice} → R {detail.newWarehousePrice}
                      </div>
                    )}
                    
                    {/* Quantity */}
                    {detail.oldQuantity !== undefined && detail.newQuantity !== undefined && (
                      <div className={detail.oldQuantity !== detail.newQuantity ? "text-primary" : ""}>
                        Qty: {detail.oldQuantity} → {detail.newQuantity}
                      </div>
                    )}
                    
                    {/* Fallback for old format */}
                    {detail.newPrice !== undefined && detail.oldPrice !== undefined && 
                     detail.oldRegularPrice === undefined && (
                      <div className={detail.oldPrice !== detail.newPrice ? "text-primary" : ""}>
                        Price: R {detail.oldPrice} → R {detail.newPrice}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 text-sm rounded-md bg-muted p-4">
          <div className="flex items-start gap-2">
            {progressPercentage < 100 ? (
              <Loader2 className="h-5 w-5 mt-0.5 animate-spin text-primary" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 text-green-600" />
            )}
            <div>
              <p className="font-medium">{getStatusMessage()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage < 100 
                  ? "The update process can take several minutes depending on the number of products and stores." 
                  : "All products have been processed and the prices are now updated across all stores."}
              </p>
              
              {progress.successCount !== undefined && (
                <p className="mt-2">
                  <span className="text-green-600 font-medium">{progress.successCount} successful</span>
                  {progress.errorCount !== undefined && progress.errorCount > 0 && (
                    <span className="ml-3 text-red-600 font-medium">{progress.errorCount} failed</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant={progressPercentage === 100 ? "default" : "outline"}
            onClick={onCancel}
            className="gap-1"
          >
            {progressPercentage === 100 ? "Close" : "Cancel Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
