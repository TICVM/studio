
"use client"

import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useUser, useFirestore } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const verificationStarted = useRef(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isUserLoading || isLoginPage) return;

    if (!user) {
      router.push("/admin/login");
      return;
    }

    if (verificationStarted.current && isAdminVerified) return;
    verificationStarted.current = true;

    const verifyAdmin = async () => {
      try {
        const adminRef = doc(db, "admin_profiles", user.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            id: user.uid,
            email: user.email,
            fullName: user.displayName || "Administrador",
            role: "admin",
            createdAt: serverTimestamp()
          });
        }
        setIsAdminVerified(true);
      } catch (e) {
        console.error("Erro ao verificar/criar perfil administrativo:", e);
        setIsAdminVerified(true); 
      }
    };

    verifyAdmin();
  }, [user, isUserLoading, isLoginPage, router, db, isAdminVerified]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isUserLoading || (!isAdminVerified && user)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Autenticando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-8 shrink-0 shadow-sm z-10">
          <div className="lg:hidden mr-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-none">
                <AdminSidebar />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-primary leading-tight">
                {user.displayName || user.email?.split('@')[0] || "Administrador"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Acesso Master</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white">
              {user.email?.substring(0, 2).toUpperCase() || "AD"}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
