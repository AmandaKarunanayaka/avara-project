import * as React from "react"
import "/src/css/sidebar.css";
import {
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Binoculars,
  Cpu,
  ClipboardList,
  ChartLine,
  FileChartPie,
  House,
} from "lucide-react";

import { NavMain } from "@/components/ui/secondary-sidebar/nav-main";
import { NavProjects } from "@/components/ui/secondary-sidebar/nav-projects";
import { NavSecondary } from "@/components/ui/secondary-sidebar/nav-secondary";
import { NavUser } from "@/components/ui/secondary-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import avaraLogo from "@/images/avara_logo.png";
import { useParams } from "react-router-dom";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { projectId } = useParams<{ projectId?: string }>();

  const dashboardUrl = projectId ? `/dashboard/${projectId}` : "/";
  const researchUrl = projectId ? `/research/${projectId}` : "/";

  const data = {
    user: {
      name: "Amanda",
      email: "amanda.kaveesharr@gmail.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: dashboardUrl,
        icon: House,
        isActive: true,
      },
      {
        title: "Smart Research",
        url: researchUrl,
        icon: Binoculars,
        isActive: true,
      },
      {
        title: "Risk Analysis",
        url: "#",
        icon: FileChartPie,
      },
      {
        title: "Business Core Setup",
        url: "#",
        icon: Cpu,
      },
      {
        title: "Roadmap",
        url: "#",
        icon: Map,
      },
      {
        title: "Task Allocation",
        url: "#",
        icon: ClipboardList,
      },
      {
        title: "Performance Tracking",
        url: "#",
        icon: ChartLine,
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton size="lg" asChild className="no-hover">
            <div>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                <img
                  src={avaraLogo}
                  alt="AVARA Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">AVARA</span>
                <span className="truncate text-xs">Your Startup Assistant</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
