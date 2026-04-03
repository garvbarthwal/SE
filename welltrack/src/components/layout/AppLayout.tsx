'use client'

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useSession } from "next-auth/react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const { data: session } = useSession();
  const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0] || "U";
  const userName = session?.user?.name || session?.user?.email || "User";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {title && <h1 className="text-lg font-semibold text-foreground hidden sm:block">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              <div className="ml-2 h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {userInitial.toUpperCase()}
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
  );
};

export default AppLayout;
