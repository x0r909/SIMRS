"use client"

import {
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react"
import type { ComponentProps } from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Operasional",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/dashboard" },
      { title: "Appointments", url: "/appointments" },
      { title: "Queues", url: "/queues" },
      { title: "Billing", url: "/billing" },
    ],
  },
  {
    title: "Master Data",
    icon: Users,
    items: [
      { title: "Patients", url: "/patients" },
      { title: "Doctors", url: "/doctors" },
      { title: "Medicines", url: "/medicines" },
    ],
  },
  {
    title: "Penunjang Medis",
    icon: FlaskConical,
    items: [
      { title: "Laboratory", url: "/laboratory" },
      { title: "Radiology", url: "/radiology" },
      { title: "Files", url: "/files" },
    ],
  },
  {
    title: "Administrasi",
    icon: Shield,
    items: [{ title: "Users & Roles", url: "/admin" }],
  },
]

export function AppSidebar({
  user,
  onLogout,
  ...props
}: ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onLogout: () => void
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ClipboardList className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SIMRS Frontdesk</span>
                <span className="truncate text-xs">Hospital Operations</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
