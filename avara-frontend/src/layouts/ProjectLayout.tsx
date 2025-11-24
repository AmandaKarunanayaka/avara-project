import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AppLayout } from "@/components/ui/secondary-sidebar/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import "../css/layout.css";

type Project = { projectId: string; name: string; industry?: string };

export function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation() as any;

  const stateName: string | undefined = location?.state?.startupName;
  const [project, setProject] = useState<Project | null>(null);

  // Display label for page (Dashboard/Research/etc.)
  const pageLabel = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/research/")) return "Research";
    if (path.includes("/dashboard/")) return "Dashboard";
    return "Project";
  }, [location.pathname]);

  // Fetch minimal project name if not in state (debounce network churn)
  useEffect(() => {
    if (!projectId || stateName) return; // already have name from state
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const resp = await fetch("http://localhost:3004/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const items: Project[] = await resp.json();
        const found = items.find(p => p.projectId === projectId) || null;
        setProject(found);
      } catch {
        setProject(null);
      }
    })();
  }, [projectId, stateName]);

  const title = stateName || project?.name || "Project";
  const orgName = "Avara"; 

  return (
    <AppLayout>
      <header className="flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 px-4 min-w-0 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="min-w-0">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{orgName}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block arrow" />
              <BreadcrumbItem className="min-w-0 max-w-[40%]">
                <BreadcrumbLink className="truncate text-ellipsis block">
                  {title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block arrow" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Keep content from “gumbling” with consistent paddings and overflow */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0 overflow-auto">
        {children}
      </div>
    </AppLayout>
  );
}
