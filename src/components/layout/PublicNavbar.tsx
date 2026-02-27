
"use client"

import Link from "next/link";
import { Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <Users size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">PessoasEmpresa</span>
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
