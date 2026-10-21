"use client";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-4">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

