import React from "react";
import Sidebar from "./sidebar-new";
import { useLocation } from "wouter";
import { Bell, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Determine the title based on the current path
  const getTitle = () => {
    switch (true) {
      case location === "/":
        return "Dashboard";
      case location === "/upload-pricing":
        return "Upload Pricing";
      case location === "/update-history":
        return "Update History";
      case location === "/database-settings":
        return "Database Settings";
      case location === "/user-management":
        return "User Management";
      case location === "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} />
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          {children}
        </main>
      </div>
    </div>
  );
}
