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
  products_count: number;
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
          <Badge variant="outline" className="bg-green-500 bg-opacity-10 border border-green-500 text-green-600 dark:text-green-400 dark:border-green-500 dark:bg-green-500/20 font-medium">
            Completed
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="outline" className="bg-amber-500 bg-opacity-10 border border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-500 dark:bg-amber-500/20 font-medium">
            Partial
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-500 bg-opacity-10 border border-red-500 text-red-600 dark:text-red-400 dark:border-red-500 dark:bg-red-500/20 font-medium">
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
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs text-muted-foreground">Filename</TableHead>
                <TableHead className="text-xs text-muted-foreground">Products Updated</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground">User</TableHead>
                <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
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
                      {update.products_count}
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
      <CardFooter className="px-6 py-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
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
