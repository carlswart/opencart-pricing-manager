import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Clock, RefreshCw, Store, ArrowUp, CheckCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { MilestoneCard } from "@/components/dashboard/milestone-card";
import { UploadModal } from "@/components/modals/upload-modal";
import { DatabaseSettingsModal } from "@/components/modals/database-settings-modal";
// SpreadsheetPreviewModal import removed
import { Store as StoreType, DbConnection } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dbSettingsModalOpen, setDbSettingsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Define types for dashboard stats
  interface DashboardStats {
    timeSaved: string;
    timeMinutes: number;
    recentUpdates: number;
    connectedStores: string;
    lastUpdateTime: string;
    timeChangePercent: string;
  }
  
  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to refresh all dashboard data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      // Updates query invalidation removed
      console.log("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Recent updates type definition removed
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000, // Refetch every 5 seconds
    onSuccess: (data) => {
      // Diagnostic log to check what's coming from the API
      console.log("Dashboard stats received:", data);
    },
    onError: (error) => {
      console.error("Failed to load dashboard stats:", error);
    }
  });
  
  // Recent updates fetching removed
  
  // Fetch stores for upload modal
  const { data: stores } = useQuery<StoreType[]>({
    queryKey: ['/api/stores'],
  });
  
  // Fetch database connections for settings modal
  const { data: connections } = useQuery<DbConnection[]>({
    queryKey: ['/api/database/connections'],
  });
  
  const handleUploadClick = () => {
    setLocation("/upload-pricing");
  };
  
  const handleDatabaseClick = () => {
    setLocation("/database-settings");
  };
  
  const handleHistoryClick = () => {
    setLocation("/update-history");
  };
  
  // Recent updates preview handlers removed

  return (
    <div>
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          onClick={refreshData} 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Time Saved"
          value={statsLoading ? "Loading..." : stats?.timeSaved || "0 min"}
          icon={<Clock className="text-white" />}
          iconBgColor="bg-primary"
          iconColor="text-white"
          tooltip="Time saved is calculated as 1 minute per product. Each completed update in the database counts as 1 minute saved."
          footer={
            <div className="text-xs text-success flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>{stats?.timeChangePercent || "+0%"}</span>
            </div>
          }
        />
        
        <StatsCard
          title="Recent Updates"
          value={statsLoading ? "Loading..." : (stats?.recentUpdates ?? 0)}
          icon={<RefreshCw className="text-white" />}
          iconBgColor="bg-primary"
          iconColor="text-white"
          footer={
            <div className="text-xs text-muted-foreground">
              <span>Last update: {statsLoading ? "Loading..." : (stats?.lastUpdateTime ?? "Never")}</span>
            </div>
          }
        />
        
        <StatsCard
          title="Connected Stores"
          value={statsLoading ? "Loading..." : (stats?.connectedStores ?? "0/0")}
          icon={<Store className="text-white" />}
          iconBgColor="bg-primary" 
          iconColor="text-white"
          footer={(() => {
            if (statsLoading) return (
              <div className="text-xs text-muted-foreground flex items-center">
                <span>Loading connection status...</span>
              </div>
            );
            
            const [connected, total] = (stats?.connectedStores ?? "0/0").split("/").map(Number);
            const allConnected = connected === total && total > 0;
            const noStores = total === 0;
            
            if (noStores) {
              return (
                <div className="text-xs text-muted-foreground flex items-center">
                  <span>No stores configured</span>
                </div>
              );
            } else if (allConnected) {
              return (
                <div className="text-xs text-success flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>All stores connected</span>
                </div>
              );
            } else {
              return (
                <div className="text-xs text-amber-500 flex items-center">
                  <Store className="h-3 w-3 mr-1" />
                  <span>{connected === 0 ? "No stores connected" : `${total - connected} stores need connection`}</span>
                </div>
              );
            }
          })()}
        />
      </div>
      
      {/* Milestone Card - full width */}
      <div className="mb-6">
        <MilestoneCard />
      </div>
      
      {/* Quick Actions - full width */}
      <div className="mb-6">
        <QuickActions
          onUploadClick={handleUploadClick}
          onDatabaseClick={handleDatabaseClick}
          onHistoryClick={handleHistoryClick}
        />
      </div>
      
      {/* Recent Updates section removed as requested */}
      
      {/* Modals */}
      {stores && (
        <UploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          stores={stores}
        />
      )}
      
      {stores && connections && (
        <DatabaseSettingsModal
          open={dbSettingsModalOpen}
          onOpenChange={setDbSettingsModalOpen}
          stores={stores}
          connections={connections}
          selectedStoreId={null}
        />
      )}
      
      {/* Spreadsheet Preview Modal removed */}
    </div>
  );
}
