'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function DashboardLayoutClient({
  children,
  userInitial,
  userName,
}: {
  children: React.ReactNode
  userInitial: string
  userName: string
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground">WellTrack</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="ml-2 h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {userInitial}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
