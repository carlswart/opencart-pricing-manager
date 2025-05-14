import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import UploadPricing from "@/pages/upload-pricing";
import UpdateHistory from "@/pages/update-history";
import DatabaseSettings from "@/pages/database-settings";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";

export function Routes() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute 
        path="/" 
        component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/upload-pricing" 
        component={() => (
          <AppLayout>
            <UploadPricing />
          </AppLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/update-history" 
        component={() => (
          <AppLayout>
            <UpdateHistory />
          </AppLayout>
        )} 
      />
      
      <ProtectedRoute 
        path="/database-settings" 
        component={() => (
          <AppLayout>
            <DatabaseSettings />
          </AppLayout>
        )} 
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}
