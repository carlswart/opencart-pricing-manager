import { Switch, Route, Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import UploadPricing from "@/pages/upload-pricing";
import UpdateHistory from "@/pages/update-history";
import DatabaseSettings from "@/pages/database-settings";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";

// Auth route wrapper to redirect unauthenticated users to login
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  if (!isAuthenticated) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }
  
  return <Component {...rest} />;
}

export function Routes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/upload-pricing" component={UploadPricing} />
            <Route path="/update-history" component={UpdateHistory} />
            <Route path="/database-settings" component={DatabaseSettings} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}
