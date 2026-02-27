
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Lock, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push("/admin/dashboard");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-primary hover:underline transition-all"
      >
        <ArrowLeft size={16} />
        Voltar para o Carômetro
      </Link>
      
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Users size={32} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">Acesso Restrito</CardTitle>
            <CardDescription>
              Entre com suas credenciais de administrador.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@empresa.com" 
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no Painel"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            Este sistema é de uso exclusivo da PessoasEmpresa. O acesso não autorizado é proibido.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
