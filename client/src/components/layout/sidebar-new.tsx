import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  FileUp, 
  History, 
  Database, 
  Users, 
  Settings, 
  LogOut,
  RefreshCw,
} from "lucide-react";

// Helper function to get user initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Menu item type
type MenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

// Main navigation items
const mainNavItems: MenuItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Dashboard",
    href: "/"
  },
  {
    icon: <FileUp className="h-5 w-5" />,
    label: "Upload Pricing",
    href: "/upload-pricing"
  },
  {
    icon: <History className="h-5 w-5" />,
    label: "Update History",
    href: "/update-history"
  }
];

// Admin navigation items
const adminNavItems: MenuItem[] = [
  {
    icon: <Database className="h-5 w-5" />,
    label: "Database Settings",
    href: "/database-settings"
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "User Management",
    href: "/user-management"
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Settings",
    href: "/settings"
  }
];

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Function to check if a route is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") {
      return true;
    }
    return path !== "/" && location.startsWith(path);
  };
  
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
      {/* App Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-card-foreground">PriceSync</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-4 py-2 text-sm text-muted-foreground uppercase">Main</div>
        <ul>
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div className={`flex items-center gap-3 px-6 py-2 cursor-pointer ${
                  isActive(item.href)
                    ? "border-l-4 border-primary bg-primary/10 text-primary" 
                    : "border-l-4 border-transparent text-card-foreground hover:bg-muted/50"
                }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Admin Navigation - Only show to admin users */}
        {user?.role === 'admin' && (
          <>
            <div className="px-4 py-2 mt-4 text-sm text-muted-foreground uppercase">Admin</div>
            <ul>
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div className={`flex items-center gap-3 px-6 py-2 cursor-pointer ${
                      isActive(item.href)
                        ? "border-l-4 border-primary bg-primary/10 text-primary" 
                        : "border-l-4 border-transparent text-card-foreground hover:bg-muted/50"
                    }`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium text-card-foreground">{user.name}</div>
                <div className="text-muted-foreground">{user.role}</div>
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-muted-foreground hover:text-primary"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}