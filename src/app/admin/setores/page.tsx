
"use client"

import { useState } from "react";
import { Grid, Plus, Edit2, Trash2, Search, Loader2, FileText, Upload, Tags } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Setor, Funcionario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

export default function SetoresPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Setor | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    const subcatsRaw = formData.get("subcategorias") as string;
    
    const subcategorias = subcatsRaw 
      ? subcatsRaw.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : [];

    if (editingSector) {
      updateDocumentNonBlocking(doc(firestore, "sectors", editingSector.id), { 
        nome, 
        subcategorias 
      });
      toast({ title: "Sucesso", description: "Setor atualizado." });
    } else {
      addDocumentNonBlocking(sectorsRef, {
        nome,
        subcategorias,
        data_criacao: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso", description: "Setor criado." });
    }

    setIsDialogOpen(false);
    setEditingSector(null);
  };

  const handleDelete = (id: string) => {
    const memberCount = employees?.filter(f => f.setor_id === id).length || 0;
    if (memberCount > 0) {
      toast({ variant: "destructive", title: "Ação negada", description: "O setor possui membros vinculados. Remova-os antes de excluir o setor." });
      return;
    }
    if (window.confirm("Deseja realmente excluir este setor?")) {
      const docRef = doc(firestore, "sectors", id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Excluído", description: "Setor removido com sucesso." });
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
        let count = 0;
        for (const row of jsonData) {
          const nome = row.Nome || row.Setor;
          if (nome) {
            addDocumentNonBlocking(sectorsRef, {
              nome,
              subcategorias: row.Subcategorias?.split(',').map((s: string) => s.trim()) || [],
              data_criacao: new Date().toISOString(),
              createdAt: serverTimestamp(),
            });
            count++;
          }
        }
        toast({ title: "Sucesso", description: `${count} setores importados.` });
        setIsBulkDialogOpen(false);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Falha na importação." });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(excelFile);
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
          <p className="text-muted-foreground">Gerencie departamentos e suas subcategorias.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11"><FileText className="mr-2 h-4 w-4" />Importar</Button>
            </DialogTrigger>
            <DialogContent>
              <Input type="file" accept=".xlsx, .xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
              <Button onClick={handleExcelUpload} disabled={!excelFile || isProcessing}>Processar</Button>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSector(null);
          }}>
            <DialogTrigger asChild>
              <Button className="h-11 shadow-md"><Plus className="mr-2 h-4 w-4" />Novo Setor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingSector ? "Editar Setor" : "Criar Novo Setor"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Setor</Label>
                    <Input id="nome" name="nome" defaultValue={editingSector?.nome} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subcategorias" className="flex items-center gap-2"><Tags size={14} /> Subcategorias (vírgula)</Label>
                    <Input id="subcategorias" name="subcategorias" defaultValue={editingSector?.subcategorias?.join(", ")} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" className="w-full h-11">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Subcategorias</TableHead><TableHead>Membros</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredSetores.map((setor) => {
              const count = employees?.filter(f => f.setor_id === setor.id).length || 0;
              return (
                <TableRow key={setor.id} className="group">
                  <TableCell className="font-bold text-primary">{setor.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {setor.subcategorias?.map(sub => <Badge key={sub} variant="secondary" className="text-[9px] uppercase">{sub}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{count}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingSector(setor); setIsDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(setor.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
