import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Store } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { SpreadsheetPreviewModal } from "./spreadsheet-preview-modal";
import { UpdateProgressModal } from "./update-progress-modal";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
}

export function UploadModal({ open, onOpenChange, stores }: UploadModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedStores, setSelectedStores] = useState<number[]>(stores.map(store => store.id));
  const [updateOptions, setUpdateOptions] = useState({
    updateRegularPrices: true,
    updateDepotPrices: true,
    updateWarehousePrices: true,
    updateQuantities: true,
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    overall: number;
    stores: { id: number; name: string; progress: number }[];
  }>({
    overall: 0,
    stores: [],
  });

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleStoreSelection = (storeId: number, checked: boolean) => {
    if (checked) {
      setSelectedStores([...selectedStores, storeId]);
    } else {
      setSelectedStores(selectedStores.filter(id => id !== storeId));
    }
  };

  const handleSelectAllStores = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(store => store.id));
    }
  };

  const handleStartUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload",
      });
      return;
    }

    if (selectedStores.length === 0) {
      toast({
        variant: "destructive",
        title: "No stores selected",
        description: "Please select at least one store to update",
      });
      return;
    }

    // Create form data to send the file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("options", JSON.stringify({
      stores: selectedStores,
      updateOptions,
    }));

    try {
      // First, preview the file to validate it
      const response = await fetch("/api/spreadsheet/preview", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to preview spreadsheet");
      }
      
      const previewResult = await response.json();
      setPreviewData(previewResult);
      setShowPreview(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    }
  };

  const handleConfirmUpdate = async () => {
    setShowPreview(false);
    setShowProgress(true);
    
    try {
      // Create a new FormData with the same file and options
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("options", JSON.stringify({
        stores: selectedStores,
        updateOptions,
      }));
      
      // Endpoint to start the update
      const response = await fetch("/api/spreadsheet/process", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to process spreadsheet");
      }
      
      const { updateId } = await response.json();
      
      // Setup polling to track progress
      const pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch(`/api/updates/${updateId}/progress`, {
            credentials: "include",
          });
          
          if (!progressRes.ok) {
            throw new Error("Failed to fetch progress");
          }
          
          const progress = await progressRes.json();
          setUpdateProgress(progress);
          
          // If the update is complete, stop polling
          if (progress.overall === 100) {
            clearInterval(pollInterval);
            setTimeout(() => {
              setShowProgress(false);
              onOpenChange(false);
              
              toast({
                title: "Update complete",
                description: "All stores have been updated successfully",
              });
            }, 1000);
          }
        } catch (error) {
          console.error("Failed to fetch progress:", error);
        }
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to process file",
      });
      setShowProgress(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowProgress(false);
    // Implement actual cancellation if needed
    toast({
      title: "Update cancelled",
      description: "The price update has been cancelled",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Price Sheet</DialogTitle>
            <DialogDescription>
              Upload a spreadsheet containing product pricing and inventory updates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-6">
            <FileUpload
              accept={{
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'text/csv': ['.csv'],
              }}
              onFilesSelected={handleFileSelected}
            />
            {file && (
              <p className="mt-2 text-sm text-primary">Selected: {file.name}</p>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Select Stores to Update</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {stores.map((store) => (
                <div 
                  key={store.id}
                  className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
                >
                  <Checkbox 
                    id={`store-${store.id}`} 
                    checked={selectedStores.includes(store.id)} 
                    onCheckedChange={(checked) => 
                      handleStoreSelection(store.id, checked as boolean)
                    }
                    className="mr-3 h-5 w-5"
                  />
                  <Label htmlFor={`store-${store.id}`} className="flex flex-col cursor-pointer">
                    <span className="text-sm font-medium text-neutral-600">{store.name}</span>
                    <span className="text-xs text-neutral-500">{store.url}</span>
                  </Label>
                </div>
              ))}
              <Button
                variant="outline"
                className="flex items-center justify-center text-primary text-sm p-3 border border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50"
                onClick={handleSelectAllStores}
              >
                <span>
                  {selectedStores.length === stores.length ? "Deselect All Stores" : "Select All Stores"}
                </span>
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Update Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="update-regular-prices" 
                  checked={updateOptions.updateRegularPrices}
                  onCheckedChange={(checked) => 
                    setUpdateOptions({...updateOptions, updateRegularPrices: checked as boolean})
                  }
                />
                <Label htmlFor="update-regular-prices">Update regular prices</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="update-depot-prices" 
                  checked={updateOptions.updateDepotPrices}
                  onCheckedChange={(checked) => 
                    setUpdateOptions({...updateOptions, updateDepotPrices: checked as boolean})
                  }
                />
                <Label htmlFor="update-depot-prices">Calculate and update Depot prices (18% discount)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="update-warehouse-prices" 
                  checked={updateOptions.updateWarehousePrices}
                  onCheckedChange={(checked) => 
                    setUpdateOptions({...updateOptions, updateWarehousePrices: checked as boolean})
                  }
                />
                <Label htmlFor="update-warehouse-prices">Calculate and update Warehouse prices (26% discount)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="update-quantities" 
                  checked={updateOptions.updateQuantities}
                  onCheckedChange={(checked) => 
                    setUpdateOptions({...updateOptions, updateQuantities: checked as boolean})
                  }
                />
                <Label htmlFor="update-quantities">Update product quantities</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleStartUpload}>
              Start Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Spreadsheet Preview Modal */}
      <SpreadsheetPreviewModal 
        open={showPreview}
        onOpenChange={setShowPreview}
        data={previewData}
        onConfirm={handleConfirmUpdate}
      />
      
      {/* Update Progress Modal */}
      <UpdateProgressModal 
        open={showProgress}
        progress={updateProgress}
        onCancel={handleCancelUpdate}
      />
    </>
  );
}
