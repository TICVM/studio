
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Grid, LogOut, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import NextImage from "next/image";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Funcionários", href: "/admin/funcionarios", icon: Users },
  { label: "Setores", href: "/admin/setores", icon: Grid },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  const logoStyle = settings?.logoStyle || "square_with_name";
  const logoHeight = settings?.logoHeight || 48;

  return (
    <div className="w-64 bg-sidebar flex flex-col h-screen shrink-0 border-r border-sidebar-border transition-all">
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          {logoStyle === "square_with_name" ? (
            <>
              <div 
                className="bg-primary p-2 rounded-xl text-white relative overflow-hidden shrink-0 shadow-sm"
                style={{ width: logoHeight, height: logoHeight }}
              >
                {settings?.logoUrl ? (
                  <NextImage src={settings.logoUrl} alt="Logo" fill className="object-contain p-1.5" />
                ) : (
                  <Users size={logoHeight * 0.5} />
                )}
              </div>
              <span 
                className="font-black tracking-tighter text-sidebar-foreground truncate"
                style={{ fontSize: Math.max(14, logoHeight * 0.4) }}
              >
                {settings?.systemName || "AdminPanel"}
              </span>
            </>
          ) : (
            <div className="w-full flex items-center justify-start overflow-hidden" style={{ height: logoHeight }}>
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-auto object-contain" />
              ) : (
                <span 
                  className="font-black tracking-tighter text-sidebar-foreground"
                  style={{ fontSize: Math.max(14, logoHeight * 0.4) }}
                >
                  {settings?.systemName || "AdminPanel"}
                </span>
              )}
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10" asChild>
          <Link href="/">
            <LogOut className="mr-3 h-4 w-4" />
            Sair do Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
