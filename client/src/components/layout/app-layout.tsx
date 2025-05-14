import React from "react";
import Sidebar from "./sidebar";
import { useLocation } from "wouter";
import { Bell, HelpCircle } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold text-neutral-600">{title}</h1>
        <div className="flex items-center gap-4">
          <button className="text-neutral-500 hover:text-neutral-700">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-neutral-500 hover:text-neutral-700">
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
