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
  Download
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
}

export function SpreadsheetPreviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
}: SpreadsheetPreviewModalProps) {
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
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Backup Information</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <p className="mb-2">This update includes automatic backups that were created before changes were made:</p>
                  <div className="space-y-2 mt-3">
                    {backups.map((backup, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 border border-blue-100 rounded-sm">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{backup.storeName}</div>
                          <div className="text-xs text-neutral-500">{backup.backupName}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-blue-600 hover:text-blue-800"
                          onClick={() => handleRestoreBackup(backup.storeId, backup.backupName)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            <div className="border border-neutral-200 rounded overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead className="border-r border-neutral-200">SKU</TableHead>
                      <TableHead className="border-r border-neutral-200">Product Name</TableHead>
                      <TableHead className="border-r border-neutral-200">Regular Price</TableHead>
                      <TableHead className="border-r border-neutral-200">Depot Price</TableHead>
                      <TableHead className="border-r border-neutral-200">Warehouse Price</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "hover:bg-neutral-50",
                          index % 2 === 1 && "bg-neutral-50"
                        )}
                      >
                        <TableCell className="border-r border-neutral-200">{row.sku}</TableCell>
                        <TableCell className="border-r border-neutral-200">{row.name}</TableCell>
                        <TableCell className="border-r border-neutral-200">R {row.regularPrice}</TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200",
                          row.hasDepotPriceError && "font-medium text-destructive"
                        )}>
                          R {row.depotPrice}
                        </TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200",
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
            <Alert className="mt-4 border-amber-500 text-amber-800 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
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
              Cancel
            </Button>
            <Button onClick={onConfirm}>
              Continue with Update
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
