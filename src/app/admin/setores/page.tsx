"use client"

import { useState } from "react";
import { Grid, Plus, Edit2, Trash2, Search, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Setor, Funcionario } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function SetoresPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Setor | null>(null);
  const [bulkText, setBulkText] = useState("");

  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);
  const employeesRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);

  const { data: sectors, isLoading: loadingSectors } = useCollection<Setor>(sectorsRef);
  const { data: employees } = useCollection<Funcionario>(employeesRef);

  const filteredSetores = sectors?.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;

    if (editingSector) {
      updateDocumentNonBlocking(doc(firestore, "sectors", editingSector.id), { nome });
      toast({ title: "Sucesso", description: "Setor atualizado." });
    } else {
      addDocumentNonBlocking(sectorsRef, {
        nome,
        data_criacao: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso", description: "Setor criado." });
    }

    setIsDialogOpen(false);
    setEditingSector(null);
  };

  const handleBulkSave = () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    if (names.length === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Insira ao menos um nome de setor." });
      return;
    }

    names.forEach(nome => {
      addDocumentNonBlocking(sectorsRef, {
        nome,
        data_criacao: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    });

    toast({ title: "Sucesso", description: `${names.length} setores cadastrados em massa.` });
    setIsBulkDialogOpen(false);
    setBulkText("");
  };

  const handleDelete = (id: string) => {
    const memberCount = employees?.filter(f => f.setor_id === id).length || 0;
    if (memberCount > 0) {
      toast({ variant: "destructive", title: "Ação negada", description: "Remova os funcionários deste setor antes de excluí-lo." });
      return;
    }

    if (confirm("Deseja realmente excluir este setor?")) {
      deleteDocumentNonBlocking(doc(firestore, "sectors", id));
      toast({ title: "Excluído", description: "Setor removido com sucesso." });
    }
  };

  if (loadingSectors) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Setores</h1>
          <p className="text-muted-foreground">Gerencie as divisões da empresa.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11">
                <FileText className="mr-2 h-4 w-4" />
                Cadastro em Massa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastro em Massa de Setores</DialogTitle>
                <DialogDescription>
                  Insira um nome de setor por linha para cadastrar vários de uma vez.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulk-names">Nomes dos Setores (um por linha)</Label>
                  <Textarea 
                    id="bulk-names" 
                    placeholder="Ex:&#10;Marketing&#10;Vendas&#10;Logística" 
                    className="min-h-[200px]"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBulkSave}>Cadastrar Todos</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSector(null);
          }}>
            <DialogTrigger asChild>
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingSector ? "Editar Setor" : "Criar Novo Setor"}</DialogTitle>
                  <DialogDescription>
                    Informe o nome do setor que deseja gerenciar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Setor</Label>
                    <Input id="nome" name="nome" defaultValue={editingSector?.nome} required placeholder="Ex: Financeiro" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar Setor</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar setor..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nome</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSetores.map((setor) => {
              const count = employees?.filter(f => f.setor_id === setor.id).length || 0;
              return (
                <TableRow key={setor.id}>
                  <TableCell className="font-semibold text-primary">{setor.nome}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {setor.data_criacao ? new Date(setor.data_criacao).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingSector(setor);
                        setIsDialogOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(setor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredSetores.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum setor encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
