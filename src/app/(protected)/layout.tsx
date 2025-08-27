// src/app/(protected)/layout.tsx
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "./_components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <BreadcrumbNav />
            <div className="flex items-center gap-2">
              {/* <ThemeToggle /> */}
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <div className="bg-background flex-1">{children}</div>
      </main>
    </SidebarProvider>
  );
}
