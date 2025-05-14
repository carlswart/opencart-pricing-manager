import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store } from "@shared/schema";
import { SpreadsheetPreviewModal } from "@/components/modals/spreadsheet-preview-modal";
import { UpdateProgressModal } from "@/components/modals/update-progress-modal";

export default function UploadPricing() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [updateOptions, setUpdateOptions] = useState({
    updateRegularPrices: true,
    updateDepotPrices: true,
    updateWarehousePrices: true,
    updateQuantities: true,
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({
    overall: 0,
    stores: [] as { id: number; name: string; progress: number }[],
  });

  // Fetch stores
  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      
      // Auto-select all stores when a file is uploaded
      if (stores && stores.length > 0) {
        setSelectedStores(stores.map(store => store.id));
      }
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
    if (stores) {
      if (selectedStores.length === stores.length) {
        setSelectedStores([]);
      } else {
        setSelectedStores(stores.map(store => store.id));
      }
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
      // Preview the file to validate it
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
      
      // Start the update process
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
              
              toast({
                title: "Update complete",
                description: "All stores have been updated successfully",
              });
              
              // Reset form
              setFile(null);
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
    // Implement actual cancellation logic if needed
    toast({
      title: "Update cancelled",
      description: "The price update has been cancelled",
    });
  };

  return (
    <div>
      <PageHeader
        title="Upload Pricing"
        description="Upload spreadsheets to update product pricing and quantities across your stores"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Spreadsheet</CardTitle>
            </CardHeader>
            <CardContent>
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

              {file && stores && stores.length > 0 && (
                <>
                  <div className="mt-6">
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

                  <div className="mt-6">
                    <Button 
                      onClick={handleStartUpload}
                      className="flex gap-2"
                      disabled={!file || selectedStores.length === 0}
                    >
                      <FileUp className="h-4 w-4" />
                      Start Upload
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Update Options</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>1. Upload an Excel or CSV file containing product data</p>
                <p>2. File should include columns for SKU, price, and quantity</p>
                <p>3. Select which stores to update</p>
                <p>4. Choose update options</p>
                <p>5. Review the preview before confirming changes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
    </div>
  );
}
