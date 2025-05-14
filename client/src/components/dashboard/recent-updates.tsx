import React from "react";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface UpdateRecord {
  id: number;
  date: string;
  filename: string;
  productsCount: number;
  status: "completed" | "partial" | "failed";
  user: string;
}

interface RecentUpdatesProps {
  updates: UpdateRecord[];
  isLoading: boolean;
  onViewAll: () => void;
  onViewDetails: (id: number) => void;
}

export function RecentUpdates({ 
  updates, 
  isLoading, 
  onViewAll, 
  onViewDetails 
}: RecentUpdatesProps) {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Price Updates</CardTitle>
        <Button 
          variant="ghost" 
          className="text-primary text-sm" 
          onClick={onViewAll}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Filename</TableHead>
                <TableHead className="text-xs">Products Updated</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading recent updates...
                  </TableCell>
                </TableRow>
              ) : updates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No updates yet
                  </TableCell>
                </TableRow>
              ) : (
                updates.map((update) => (
                  <TableRow key={update.id} className="hover:bg-neutral-50">
                    <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                      {update.date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                      {update.filename}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                      {update.productsCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(update.status)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                      {update.user}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-primary hover:text-secondary h-8 w-8"
                        onClick={() => onViewDetails(update.id)}
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
      <CardFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-neutral-500">
            <span>Showing {updates.length} of {updates.length} updates</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
            >
              Previous
            </Button>
            <Button
              variant="outline" 
              size="sm"
              disabled={true}
            >
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
