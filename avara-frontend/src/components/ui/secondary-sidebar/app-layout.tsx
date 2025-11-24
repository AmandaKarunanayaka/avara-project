import { AppSidebar } from '@/components/ui/secondary-sidebar/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="rounded-2xl overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}