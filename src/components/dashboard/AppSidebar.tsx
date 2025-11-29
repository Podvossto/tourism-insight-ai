"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Database, Calendar, LayoutDashboard, Eye } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TIDLogo } from "@/components/ui/TIDLogo";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    category: "Navigation",
  },
  {
    title: "Prediction",
    url: "/",
    icon: Brain,
    category: "Navigation",
  },
  {
    title: "Looker",
    url: "/looker",
    icon: Eye,
    category: "Navigation",
  },
];

const dataMenuItems = [
  {
    title: "Dataset",
    url: "/dataset",
    icon: Database,
    category: "Data",
  },
  {
    title: "Conditions",
    url: "/conditions",
    icon: Calendar,
    category: "Data",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center">
          <div className="group-data-[collapsible=icon]:hidden flex justify-center w-full">
            <TIDLogo size="md" showText={false} />
          </div>
          <div className="hidden group-data-[collapsible=icon]:block">
            <TIDLogo size="sm" showText={false} />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/" && pathname?.startsWith(item.url))
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/" && pathname?.startsWith(item.url))
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
