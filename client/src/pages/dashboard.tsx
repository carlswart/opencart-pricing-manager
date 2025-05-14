import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Box, RefreshCw, Store, ArrowUp, CheckCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentUpdates, UpdateRecord } from "@/components/dashboard/recent-updates";
import { UploadModal } from "@/components/modals/upload-modal";
import { DatabaseSettingsModal } from "@/components/modals/database-settings-modal";
import { Store as StoreType, DbConnection } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dbSettingsModalOpen, setDbSettingsModalOpen] = useState(false);
  
  // Define types for dashboard stats
  interface DashboardStats {
    totalProducts: string | number;
    recentUpdates: number;
    connectedStores: string;
    lastUpdateTime: string;
    productsChange: string;
  }
  
  // Define type for recent updates
  type RecentUpdate = UpdateRecord;
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
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
    setUploadModalOpen(true);
  };
  
  const handleDatabaseClick = () => {
    setDbSettingsModalOpen(true);
  };
  
  const handleHistoryClick = () => {
    setLocation("/update-history");
  };
  
  const handleViewAllUpdates = () => {
    setLocation("/update-history");
  };
  
  const handleViewUpdateDetails = (id: number) => {
    setLocation(`/update-history/${id}`);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Products"
          value={statsLoading ? "Loading..." : (stats?.totalProducts ?? 0)}
          icon={<Box />}
          iconBgColor="bg-primary"
          iconColor="text-primary"
          footer={
            <div className="text-xs text-success flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>{statsLoading ? "Loading..." : (stats?.productsChange ?? "0%")}</span>
            </div>
          }
        />
        
        <StatsCard
          title="Recent Updates"
          value={statsLoading ? "Loading..." : (stats?.recentUpdates ?? 0)}
          icon={<RefreshCw />}
          iconBgColor="bg-success"
          iconColor="text-success"
          footer={
            <div className="text-xs text-neutral-500">
              <span>Last update: {statsLoading ? "Loading..." : (stats?.lastUpdateTime ?? "Never")}</span>
            </div>
          }
        />
        
        <StatsCard
          title="Connected Stores"
          value={statsLoading ? "Loading..." : (stats?.connectedStores ?? "0/0")}
          icon={<Store />}
          iconBgColor="bg-primary"
          iconColor="text-primary"
          footer={(() => {
            if (statsLoading) return (
              <div className="text-xs text-neutral-500 flex items-center">
                <span>Loading connection status...</span>
              </div>
            );
            
            const [connected, total] = (stats?.connectedStores ?? "0/0").split("/").map(Number);
            const allConnected = connected === total && total > 0;
            const noStores = total === 0;
            
            if (noStores) {
              return (
                <div className="text-xs text-neutral-500 flex items-center">
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
      
      {/* Quick Actions */}
      <QuickActions
        onUploadClick={handleUploadClick}
        onDatabaseClick={handleDatabaseClick}
        onHistoryClick={handleHistoryClick}
      />
      
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
    </div>
  );
}
