
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Garantir que o perfil administrativo existe
      const adminRef = doc(db, "admin_profiles", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        const data = {
          id: user.uid,
          email: user.email,
          fullName: user.displayName || "Administrador",
          role: "admin",
          createdAt: serverTimestamp()
        };
        
        setDoc(adminRef, data).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: adminRef.path,
            operation: 'create',
            requestResourceData: data,
          }));
        });
      }

      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      router.push("/admin/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "E-mail ou senha inválidos.",
      });
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">Acesso Administrativo</CardTitle>
            <CardDescription>
              Acesse o painel para gerenciar sua equipe.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t py-4 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            Certifique-se de que o usuário existe no Firebase Authentication.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
