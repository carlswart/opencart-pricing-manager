import React from "react";
import { FileUp, Database, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionProps {
  onUploadClick: () => void;
  onDatabaseClick: () => void;
  onHistoryClick: () => void;
}

export function QuickActions({ 
  onUploadClick, 
  onDatabaseClick, 
  onHistoryClick 
}: QuickActionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={onUploadClick}
            className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition"
          >
            <FileUp className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Upload Price Sheet</span>
          </button>
          
          <button 
            onClick={onDatabaseClick}
            className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition"
          >
            <Database className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Manage Connections</span>
          </button>
          
          <button 
            onClick={onHistoryClick}
            className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition"
          >
            <History className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">View History</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
