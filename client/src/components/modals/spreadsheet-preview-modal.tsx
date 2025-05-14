import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  File,
  SlidersHorizontal,
  AlertTriangle,
  Shield,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SpreadsheetPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    filename: string;
    recordCount: number;
    validationIssues: string[];
    rows: any[];
    backups?: Array<{
      storeId: number;
      storeName: string;
      backupName: string;
    }>;
    hasBackups?: boolean;
  } | null;
  onConfirm: () => void;
  isHistoryView?: boolean; // Flag to indicate if this is a history view
}

export function SpreadsheetPreviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  isHistoryView = false,
}: SpreadsheetPreviewModalProps) {
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Function to handle backup restoration
  const handleRestoreBackup = async (storeId: number, backupName: string) => {
    try {
      setRestoringBackup(true);
      setRestoreMessage(null);
      
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId, backupName }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRestoreMessage({
          type: 'success',
          message: result.message || `Successfully restored ${result.restoredProducts} products`
        });
      } else {
        setRestoreMessage({
          type: 'error',
          message: result.message || 'Failed to restore backup'
        });
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setRestoreMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setRestoringBackup(false);
    }
  };
  if (!data) return null;

  const { filename, recordCount, validationIssues, rows, backups = [], hasBackups = false } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Spreadsheet Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-neutral-600">{filename}</span>
              <span className="text-sm text-neutral-500 ml-2">{recordCount} products</span>
            </div>
          </div>
          
          {/* Backup Information */}
          {hasBackups && backups.length > 0 && (
            <div className="mb-4">
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Backup Information</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  <p className="mb-2">This update includes automatic backups that were created before changes were made:</p>
                  <div className="space-y-2 mt-3">
                    {backups.map((backup, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 border border-blue-100 dark:border-blue-900 rounded-sm">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium dark:text-slate-200">{backup.storeName}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">{backup.backupName}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => handleRestoreBackup(backup.storeId, backup.backupName)}
                          disabled={restoringBackup}
                        >
                          {restoringBackup ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Restoring...
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 mr-1" /> Restore
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    
                    {/* Restoration Message */}
                    {restoreMessage && (
                      <div className={`p-3 mt-3 text-sm rounded ${
                        restoreMessage.type === 'success' 
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}>
                        {restoreMessage.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 inline-block mr-2 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 inline-block mr-2 text-red-600 dark:text-red-400" />
                        )}
                        {restoreMessage.message}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            <div className="border border-neutral-200 dark:border-neutral-700 rounded overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50 dark:bg-neutral-800">
                      <TableHead className="border-r border-neutral-200 dark:border-neutral-700">SKU</TableHead>
                      <TableHead className="border-r border-neutral-200 dark:border-neutral-700">Product Name</TableHead>
                      <TableHead className="border-r border-neutral-200 dark:border-neutral-700">Regular Price</TableHead>
                      <TableHead className="border-r border-neutral-200 dark:border-neutral-700">Depot Price</TableHead>
                      <TableHead className="border-r border-neutral-200 dark:border-neutral-700">Warehouse Price</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                          index % 2 === 1 && "bg-neutral-50 dark:bg-neutral-800"
                        )}
                      >
                        <TableCell className="border-r border-neutral-200 dark:border-neutral-700">{row.sku}</TableCell>
                        <TableCell className="border-r border-neutral-200 dark:border-neutral-700">{row.name}</TableCell>
                        <TableCell className="border-r border-neutral-200 dark:border-neutral-700">R {row.regularPrice}</TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200 dark:border-neutral-700",
                          row.hasDepotPriceError && "font-medium text-destructive"
                        )}>
                          R {row.depotPrice}
                        </TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200 dark:border-neutral-700",
                          row.hasWarehousePriceError && "font-medium text-destructive"
                        )}>
                          R {row.warehousePrice}
                        </TableCell>
                        <TableCell>{row.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          {validationIssues.length > 0 && (
            <Alert className="mt-4 border-amber-500 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Validation Issues Found</AlertTitle>
              <AlertDescription>
                <p className="mb-2">The following issues were detected with your spreadsheet:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {validationIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="flex justify-end">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isHistoryView ? "Close" : "Cancel"}
            </Button>
            {!isHistoryView && (
              <Button onClick={onConfirm}>
                Continue with Update
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
