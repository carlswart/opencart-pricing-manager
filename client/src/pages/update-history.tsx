import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UpdateRecord } from "@/components/dashboard/recent-updates";
import { SpreadsheetPreviewModal } from "@/components/modals/spreadsheet-preview-modal";
import { useToast } from "@/hooks/use-toast";

export default function UpdateHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  
  // Fetch update history
  const { data: updates, isLoading } = useQuery<UpdateRecord[]>({
    queryKey: ['/api/updates/history'],
  });
  
  // Filter updates based on search term
  const filteredUpdates = updates?.filter(update => 
    update.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.user.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const handleViewDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/updates/${id}/details`, {
        credentials: "include",
      });
      
      if (response.status === 404) {
        toast({
          title: "Update details not found",
          description: "The details for this update are not available.",
          variant: "destructive",
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch update details");
      }
      
      const detailsData = await response.json();
      
      // Ensure the data has the required structure for the preview modal
      const formattedData = {
        filename: detailsData.filename || "Unknown file",
        recordCount: detailsData.recordCount || 0,
        validationIssues: detailsData.validationIssues || [],
        rows: detailsData.rows || [],
        // Include backup information if available
        backups: detailsData.backups || [],
        hasBackups: detailsData.hasBackups || false
      };
      
      setSelectedUpdate(id);
      setPreviewData(formattedData);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to fetch update details:", error);
      toast({
        title: "Error",
        description: "Failed to load update details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadge = (status: UpdateRecord["status"]) => {
    switch(status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-success bg-opacity-10 text-success border-success border-opacity-30">
            Completed
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="outline" className="bg-warning bg-opacity-10 text-warning border-warning border-opacity-30">
            Partial
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-destructive bg-opacity-10 text-destructive border-destructive border-opacity-30">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Update History"
        description="View the history of all price and quantity updates"
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder="Search by filename or user..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              Export Log
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Products Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Loading update history...
                    </TableCell>
                  </TableRow>
                ) : filteredUpdates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      {searchTerm ? "No updates match your search" : "No update history found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell>{update.date}</TableCell>
                      <TableCell className="font-medium">{update.filename}</TableCell>
                      <TableCell>{update.productsCount}</TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell>{update.user}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleViewDetails(update.id)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Spreadsheet Preview Modal */}
      <SpreadsheetPreviewModal 
        open={showPreview}
        onOpenChange={setShowPreview}
        data={previewData}
        onConfirm={() => setShowPreview(false)}
      />
    </div>
  );
}
