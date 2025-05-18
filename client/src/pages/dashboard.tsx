import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Clock, RefreshCw, Store, ArrowUp, CheckCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentUpdates, UpdateRecord } from "@/components/dashboard/recent-updates";
import { MilestoneCard } from "@/components/dashboard/milestone-card";
import { UploadModal } from "@/components/modals/upload-modal";
import { DatabaseSettingsModal } from "@/components/modals/database-settings-modal";
import { SpreadsheetPreviewModal } from "@/components/modals/spreadsheet-preview-modal";
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
      await queryClient.invalidateQueries({ queryKey: ['/api/updates/recent'] });
      console.log("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Define type for recent updates
  type RecentUpdate = UpdateRecord;
  
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
  
  // Fetch recent updates
  const { data: recentUpdates, isLoading: updatesLoading } = useQuery<RecentUpdate[]>({
    queryKey: ['/api/updates/recent'],
  });
  
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
  
  const handleViewAllUpdates = () => {
    setLocation("/update-history");
  };
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  // Handler to view update details
  const handleViewUpdateDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/updates/${id}/details`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error("Failed to fetch update details");
        return;
      }
      
      const detailsData = await response.json();
      
      // Format the data for the preview modal
      if (Array.isArray(detailsData)) {
        // Find the update to get filename
        const update = recentUpdates?.find(u => u.id === id);
        const filename = update?.filename || "Unknown file";
        
        // Format the data for the preview modal
        const formattedData = {
          filename: filename,
          recordCount: detailsData.length,
          validationIssues: [],
          // Map the product details
          rows: detailsData.map(product => ({
            sku: product.sku || product.model || "",
            name: product.name || `Product ${product.sku || ""}`,
            regularPrice: product.oldRegularPrice !== undefined ? product.oldRegularPrice : product.newRegularPrice,
            depotPrice: product.oldDepotPrice !== undefined ? product.oldDepotPrice : product.newDepotPrice,
            warehousePrice: product.oldWarehousePrice !== undefined ? product.oldWarehousePrice : product.newWarehousePrice,
            quantity: product.oldQuantity !== undefined ? product.oldQuantity : product.newQuantity,
            // Explicitly add oldPrice fields for the comparison view
            oldRegularPrice: product.oldRegularPrice,
            oldDepotPrice: product.oldDepotPrice,
            oldWarehousePrice: product.oldWarehousePrice,
            oldQuantity: product.oldQuantity,
            // New price fields
            newRegularPrice: product.newRegularPrice,
            newDepotPrice: product.newDepotPrice,
            newWarehousePrice: product.newWarehousePrice,
            newQuantity: product.newQuantity,
            store: product.store || "Unknown Store",
            status: product.status || "unknown"
          })),
          backups: [],
          hasBackups: false
        };
        
        setPreviewData(formattedData);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Failed to fetch update details:", error);
    }
  };

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
      
      {/* Recent Updates */}
      <div className="mt-6">
        <RecentUpdates
          updates={recentUpdates ?? []}
          isLoading={updatesLoading}
          onViewAll={handleViewAllUpdates}
          onViewDetails={handleViewUpdateDetails}
        />
      </div>
      
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
      
      {/* Spreadsheet Preview Modal */}
      <SpreadsheetPreviewModal 
        open={showPreview}
        onOpenChange={setShowPreview}
        data={previewData}
        onConfirm={() => setShowPreview(false)}
        isHistoryView={true}
      />
    </div>
  );
}
