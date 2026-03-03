
"use client"

import { useState } from "react";
import { ShieldCheck, Plus, Trash2, Mail, User, Loader2, Search } from "lucide-react";
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

export default function AdministradoresPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const adminProfilesRef = useMemoFirebase(() => collection(firestore, "admin_profiles"), [firestore]);
  const { data: admins, isLoading } = useCollection<any>(adminProfilesRef);

  const filteredAdmins = (admins || []).filter(admin => 
    admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const fullName = formData.get("fullName") as string;
    const uid = formData.get("uid") as string;

    if (!uid) {
        toast({ variant: "destructive", title: "Erro", description: "O UID do Firebase Auth é obrigatório." });
        return;
    }

    const newAdminRef = doc(firestore, "admin_profiles", uid);
    const data = {
        id: uid,
        email,
        fullName,
        role: "admin",
        createdAt: serverTimestamp()
    };

    setDoc(newAdminRef, data)
        .then(() => {
            toast({ title: "Sucesso", description: "Novo administrador autorizado." });
            setIsDialogOpen(false);
        })
        .catch(async () => {
            const permissionError = new FirestorePermissionError({
                path: newAdminRef.path,
                operation: 'write',
                requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleDelete = (id: string) => {
    const docRef = doc(firestore, "admin_profiles", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Removido", description: "Acesso administrativo revogado." });
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
                <DialogTitle>Autorizar Administrador</DialogTitle>
                <DialogDescription>
                  Insira o UID do usuário (encontrado no console do Firebase) para conceder permissões.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="uid">UID do Firebase</Label>
                  <Input id="uid" name="uid" placeholder="ex: gHZ9n7s2b9X8..." required />
                  <p className="text-[10px] text-muted-foreground">O usuário deve existir no Firebase Authentication.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input id="fullName" name="fullName" placeholder="Nome do Admin" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@empresa.com" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-11">Conceder Acesso</Button>
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
                      <span className="font-semibold">{admin.fullName}</span>
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
