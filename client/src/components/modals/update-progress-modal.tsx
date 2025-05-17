import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  oldPrice: number | null;
  newPrice: number | null;
  oldQuantity: number | null;
  newQuantity: number | null;
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
          <DialogTitle>Updating Store Prices</DialogTitle>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Overall Progress</span>
            <span className="text-sm text-neutral-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-4" />
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
            <div className="max-h-36 overflow-y-auto rounded border p-2">
              {progress.updateDetails.map((detail) => (
                <div key={detail.id} className="text-xs py-1 border-b last:border-0">
                  <span className="font-medium">SKU: {detail.sku}</span> - 
                  {detail.newPrice !== null && detail.oldPrice !== null && (
                    <span> Price: {detail.oldPrice} → {detail.newPrice}</span>
                  )}
                  {detail.newQuantity !== null && detail.oldQuantity !== null && (
                    <span> Qty: {detail.oldQuantity} → {detail.newQuantity}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 text-sm text-neutral-600">
          <p>{getStatusMessage()}</p>
          {progress.successCount !== undefined && (
            <p className="mt-2">
              <span className="text-green-600">{progress.successCount} successful</span>
              {progress.errorCount !== undefined && progress.errorCount > 0 && (
                <span className="ml-3 text-red-600">{progress.errorCount} failed</span>
              )}
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            {progressPercentage === 100 ? "Close" : "Cancel Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
