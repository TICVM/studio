
"use client"

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b bg-white flex items-center px-8 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-primary leading-tight">Administrador</p>
              <p className="text-xs text-muted-foreground">admin@empresa.com</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
          </div>
        </header>
        <main className="p-8 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
