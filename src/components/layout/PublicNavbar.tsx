
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 h-full py-2">
          {logoStyle === "square_with_name" ? (
            <>
              <div className="bg-primary p-1.5 rounded-lg text-white relative w-10 h-10 overflow-hidden shrink-0">
                {settings?.logoUrl ? (
                  <NextImage src={settings.logoUrl} alt="Logo" fill className="object-contain p-1" />
                ) : (
                  <Users size={20} />
                )}
              </div>
              <span className="text-xl font-bold tracking-tight text-primary truncate max-w-[150px] sm:max-w-xs">
                {settings?.systemName || "PessoasEmpresa"}
              </span>
            </>
          ) : (
            <div className="relative h-full aspect-[4/1] flex items-center">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-auto object-contain py-1" />
              ) : (
                <span className="text-xl font-bold tracking-tight text-primary">
                  {settings?.systemName || "PessoasEmpresa"}
                </span>
              )}
            </div>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/admin/login">
              <Lock className="mr-2 h-4 w-4" />
              Área Administrativa
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild className="sm:hidden">
            <Link href="/admin/login">
              <Lock className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
