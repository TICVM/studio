
"use client"

import { useState } from "react";
import { ShieldCheck, Plus, Trash2, Mail, User, Loader2, Search, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useMemoFirebase, useCollection, useFirestore, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

export default function AdministradoresPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const adminProfilesRef = useMemoFirebase(() => collection(firestore, "admin_profiles"), [firestore]);
  const { data: admins, isLoading } = useCollection<any>(adminProfilesRef);

  const filteredAdmins = (admins || []).filter(admin => 
    admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      // Usar uma instância secundária do Firebase para não deslogar o admin atual
      const secondaryAppName = `secondary-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // Criar o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = userCredential.user.uid;

      // Deslogar da instância secundária imediatamente
      await signOut(secondaryAuth);

      // Criar o perfil no Firestore
      const newAdminRef = doc(firestore, "admin_profiles", uid);
      const data = {
        id: uid,
        email,
        fullName,
        role: "admin",
        createdAt: serverTimestamp()
      };

      await setDoc(newAdminRef, data);
      
      toast({ title: "Sucesso", description: "Novo administrador criado e autorizado." });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      let message = "Não foi possível criar o administrador.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está sendo usado.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      
      toast({ 
        variant: "destructive", 
        title: "Erro na criação", 
        description: message 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    const docRef = doc(firestore, "admin_profiles", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Removido", description: "Acesso administrativo revogado no banco de dados. (Nota: O usuário ainda existirá no Auth até ser excluído manualmente no console)." });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Administradores</h1>
          <p className="text-muted-foreground">Gerencie quem tem acesso ao painel de controle.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Novo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateAdmin}>
              <DialogHeader>
                <DialogTitle>Criar Administrador</DialogTitle>
                <DialogDescription>
                  O sistema criará automaticamente a conta no Firebase Auth e liberará o acesso.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" name="fullName" placeholder="Nome do Admin" className="pl-10" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="admin@empresa.com" className="pl-10" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" className="pl-10" required />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Informe esta senha para que o novo admin possa acessar.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-11" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Conta...
                    </>
                  ) : (
                    "Criar e Autorizar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Administrador</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {admin.fullName?.substring(0, 2).toUpperCase() || "AD"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{admin.fullName}</span>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">UID: {admin.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {admin.role || "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revogar Acesso</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja realmente remover as permissões administrativas de {admin.fullName}? 
                            Isso apagará o perfil do banco de dados, mas não excluirá a conta de autenticação (isso deve ser feito no console do Firebase).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(admin.id)} className="bg-destructive text-white hover:bg-destructive/90">
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Nenhum administrador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
