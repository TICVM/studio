
"use client"

import Link from "next/link";
import { Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import NextImage from "next/image";

export function PublicNavbar() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  const logoStyle = settings?.logoStyle || "square_with_name";
  const logoHeight = settings?.logoHeight || 48;
  const navbarHeight = Math.max(80, logoHeight + 32);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md" style={{ height: navbarHeight }}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 h-full py-2">
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
                className="font-black tracking-tighter text-primary truncate max-w-[200px] sm:max-w-md"
                style={{ fontSize: Math.max(16, logoHeight * 0.5) }}
              >
                {settings?.systemName || "PessoasEmpresa"}
              </span>
            </>
          ) : (
            <div className="relative flex items-center" style={{ height: logoHeight }}>
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-auto object-contain" />
              ) : (
                <span 
                  className="font-black tracking-tighter text-primary"
                  style={{ fontSize: Math.max(16, logoHeight * 0.5) }}
                >
                  {settings?.systemName || "PessoasEmpresa"}
                </span>
              )}
            </div>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex h-11">
            <Link href="/admin/login">
              <Lock className="mr-2 h-4 w-4" />
              Área Administrativa
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild className="sm:hidden h-11 w-11">
            <Link href="/admin/login">
              <Lock className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
