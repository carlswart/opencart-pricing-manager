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
  },
  {
    icon: <Database className="h-5 w-5" />,
    label: "Database Settings",
    href: "/database-settings"
  }
];

// Admin navigation items
const adminNavItems: MenuItem[] = [
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
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
      {/* App Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-neutral-600">PriceSync</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-4 py-2 text-sm text-neutral-500 uppercase">Main</div>
        <ul>
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a className={`flex items-center gap-3 px-6 py-2 cursor-pointer ${
                  isActive(item.href)
                    ? "border-l-4 border-primary bg-primary/10 text-primary" 
                    : "border-l-4 border-transparent text-neutral-600 hover:bg-neutral-100"
                }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Admin Navigation */}
        <div className="px-4 py-2 mt-4 text-sm text-neutral-500 uppercase">Admin</div>
        <ul>
          {adminNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a className={`flex items-center gap-3 px-6 py-2 cursor-pointer ${
                  isActive(item.href)
                    ? "border-l-4 border-primary bg-primary/10 text-primary" 
                    : "border-l-4 border-transparent text-neutral-600 hover:bg-neutral-100"
                }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="text-neutral-500">{user.role}</div>
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-neutral-500 hover:text-primary"
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