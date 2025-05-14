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

interface UpdateProgressModalProps {
  open: boolean;
  progress: {
    overall: number;
    stores: StoreProgress[];
  };
  onCancel: () => void;
}

export function UpdateProgressModal({
  open,
  progress,
  onCancel,
}: UpdateProgressModalProps) {
  const getStatusMessage = () => {
    if (progress.overall === 100) {
      return "Update complete! All stores have been updated successfully.";
    } else if (progress.overall === 0) {
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
            <span className="text-sm text-neutral-600">{progress.overall}%</span>
          </div>
          <Progress value={progress.overall} className="h-4" />
        </div>
        
        <div className="space-y-4">
          {progress.stores.map((store) => (
            <div key={store.id}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">{store.name}</span>
                <span className="text-sm text-neutral-600">{store.progress}%</span>
              </div>
              <Progress value={store.progress} className="h-3" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-sm text-neutral-600">
          <p>{getStatusMessage()}</p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={progress.overall === 100}
          >
            {progress.overall === 100 ? "Close" : "Cancel Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
