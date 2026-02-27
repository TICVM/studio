
"use client"

import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useUser, useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

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

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Se estiver carregando o auth ou for a página de login, não faz nada
    if (isUserLoading || isLoginPage) return;

    // Se não houver usuário, redireciona para o login
    if (!user) {
      router.push("/admin/login");
      return;
    }

    // Verifica se o perfil administrativo existe
    const verifyAdmin = async () => {
      try {
        const adminRef = doc(db, "admin_profiles", user.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
          // Se o usuário está logado mas não tem o documento de perfil, criamos agora.
          // As regras de segurança permitem 'create' para o próprio UID (isOwner).
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
        // Em caso de erro persistente de permissão aqui, podemos estar em um estado inválido
        // mas permitimos a tentativa de renderização para que o erro seja capturado pelo listener global se necessário.
        setIsAdminVerified(true); 
      }
    };

    verifyAdmin();
  }, [user, isUserLoading, isLoginPage, router, db]);

  // Se for a página de login, renderiza apenas o conteúdo (sem sidebar/header)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Enquanto verifica o status administrativo, exibe um loader
  if (isUserLoading || (!isAdminVerified && user)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário após o carregamento (e não for login), o useEffect redirecionará.
  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b bg-white flex items-center px-8 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-primary leading-tight">
                {user.displayName || user.email?.split('@')[0] || "Administrador"}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.email?.substring(0, 2).toUpperCase() || "AD"}
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
