import React from "react";
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

  const { filename, recordCount, validationIssues, rows } = data;

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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-primary">
                <File className="h-4 w-4 mr-1" />
                <span>Download</span>
              </Button>
              <Button variant="outline" size="sm" className="text-primary">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                <span>Map Columns</span>
              </Button>
            </div>
          </div>
          
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
                        <TableCell className="border-r border-neutral-200">${row.regularPrice}</TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200",
                          row.hasDepotPriceError && "font-medium text-destructive"
                        )}>
                          ${row.depotPrice}
                        </TableCell>
                        <TableCell className={cn(
                          "border-r border-neutral-200",
                          row.hasWarehousePriceError && "font-medium text-destructive"
                        )}>
                          ${row.warehousePrice}
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
            <Alert variant="warning" className="mt-4">
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
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" className="text-warning">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span>Fix Validation Issues</span>
          </Button>
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
