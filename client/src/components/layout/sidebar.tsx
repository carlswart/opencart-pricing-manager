import { Link, useRoute } from "wouter";
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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

function SidebarItem({ icon, label, href, isActive }: SidebarItemProps) {
  const baseClasses = "flex items-center gap-3 px-6 py-2 hover:bg-neutral-100";
  const activeClasses = "bg-primary bg-opacity-10 border-l-4 border-primary text-primary";
  const inactiveClasses = "text-neutral-600 border-l-4 border-transparent";
  
  return (
    <Link href={href} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  
  const [isDashboardActive] = useRoute("/");
  const [isUploadActive] = useRoute("/upload-pricing");
  const [isHistoryActive] = useRoute("/update-history");
  const [isDatabaseActive] = useRoute("/database-settings");
  const [isUserManagementActive] = useRoute("/user-management");
  const [isSettingsActive] = useRoute("/settings");
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
      <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-neutral-600">PriceSync</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 py-2 text-sm text-neutral-500 uppercase">Main</div>
        <SidebarItem 
          icon={<LayoutDashboard className="h-5 w-5" />} 
          label="Dashboard" 
          href="/" 
          isActive={isDashboardActive} 
        />
        <SidebarItem 
          icon={<FileUp className="h-5 w-5" />} 
          label="Upload Pricing" 
          href="/upload-pricing" 
          isActive={isUploadActive} 
        />
        <SidebarItem 
          icon={<History className="h-5 w-5" />} 
          label="Update History" 
          href="/update-history" 
          isActive={isHistoryActive} 
        />
        <SidebarItem 
          icon={<Database className="h-5 w-5" />} 
          label="Database Settings" 
          href="/database-settings" 
          isActive={isDatabaseActive} 
        />
        
        <div className="px-4 py-2 mt-4 text-sm text-neutral-500 uppercase">Admin</div>
        <SidebarItem 
          icon={<Users className="h-5 w-5" />} 
          label="User Management" 
          href="/user-management" 
          isActive={isUserManagementActive} 
        />
        <SidebarItem 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          href="/settings" 
          isActive={isSettingsActive} 
        />
      </nav>
      
      {user && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-primary text-white">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-neutral-600">{user.name}</div>
              <div className="text-xs text-neutral-500">{user.role}</div>
            </div>
            <button 
              onClick={() => logoutMutation.mutate()} 
              className="ml-auto text-neutral-500 hover:text-neutral-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
