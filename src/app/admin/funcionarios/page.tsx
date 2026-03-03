
"use client"

import { useState, useMemo, useEffect } from "react";
import NextImage from "next/image";
import { Users, Plus, Edit2, Trash2, Search, FileText, Loader2, Upload, Crown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Funcionario, Setor } from "@/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

export default function FuncionariosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiderChecked, setIsLiderChecked] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");

  const employeesRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);

  const { data: employees, isLoading: loadingEmployees } = useCollection<Funcionario>(employeesRef);
  const { data: sectors } = useCollection<Setor>(sectorsRef);

  useEffect(() => {
    if (isDialogOpen) {
      if (editingFunc) {
        setIsLiderChecked(!!editingFunc.is_lider);
        setSelectedSectorId(editingFunc.setor_id || "");
      } else {
        setIsLiderChecked(false);
        setSelectedSectorId("");
      }
    }
  }, [editingFunc, isDialogOpen]);

  const currentSectorSubcategorias = useMemo(() => {
    const sector = sectors?.find(s => s.id === selectedSectorId);
    return sector?.subcategorias || [];
  }, [sectors, selectedSectorId]);

  const filteredEmployees = useMemo(() => {
    return (employees || [])
      .filter(f => 
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cargo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.is_lider && !b.is_lider) return -1;
        if (!a.is_lider && b.is_lider) return 1;
        return a.nome.localeCompare(b.nome);
      });
  }, [employees, searchTerm]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      cargo: formData.get("cargo") as string,
      setor_id: formData.get("setor_id") as string,
      subcategoria: formData.get("subcategoria") as string || "",
      status: formData.get("status") as "ativo" | "inativo",
      is_lider: isLiderChecked,
      titulo_lider: isLiderChecked ? (formData.get("titulo_lider") as string || "Líder de Setor") : "",
      email: formData.get("email") as string,
      ramal: formData.get("ramal") as string,
      unidade: formData.get("unidade") as string,
      foto_url: (formData.get("foto_url") as string) || `https://picsum.photos/seed/${Math.random()}/400/533`,
    };

    if (editingFunc) {
      updateDocumentNonBlocking(doc(firestore, "employees", editingFunc.id), data);
      toast({ title: "Sucesso", description: "Colaborador atualizado." });
    } else {
      addDocumentNonBlocking(employeesRef, {
        ...data,
        data_criacao: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso", description: "Colaborador cadastrado." });
    }

    setIsDialogOpen(false);
    setEditingFunc(null);
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um arquivo Excel." });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        let successCount = 0;
        for (const row of jsonData) {
          const nome = row.Nome || row.nome;
          const cargo = row.Cargo || row.cargo;
          if (nome && cargo) {
            addDocumentNonBlocking(employeesRef, {
              nome,
              cargo,
              setor_id: row.SetorID || "",
              subcategoria: row.Subcategoria || "",
              status: row.Status?.toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
              is_lider: !!row.Lider,
              titulo_lider: row.TituloLider || "",
              foto_url: row.FotoURL || `https://picsum.photos/seed/${Math.random()}/400/533`,
              email: row.Email || "",
              ramal: row.Ramal || "",
              unidade: row.Unidade || "",
              data_criacao: new Date().toISOString(),
              createdAt: serverTimestamp(),
            });
            successCount++;
          }
        }
        toast({ title: "Sucesso", description: `${successCount} colaboradores importados.` });
        setIsBulkDialogOpen(false);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Falha ao ler o arquivo Excel." });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente excluir este colaborador?")) {
      const docRef = doc(firestore, "employees", id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Excluído", description: "Colaborador removido com sucesso." });
    }
  };

  if (loadingEmployees) {
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie sua equipe e informações de contato.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 shadow-sm">
                <FileText className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Importar Planilha</DialogTitle>
                <DialogDescription>Selecione um arquivo .xlsx para importar.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <Input type="file" accept=".xlsx, .xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
              </div>
              <DialogFooter>
                <Button onClick={handleExcelUpload} disabled={!excelFile || isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingFunc(null);
          }}>
            <DialogTrigger asChild>
              <Button className="h-11 shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingFunc ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
                  <DialogDescription>Preencha os dados do colaborador.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" name="nome" defaultValue={editingFunc?.nome} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input id="cargo" name="cargo" defaultValue={editingFunc?.cargo} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="setor_id">Setor</Label>
                      <Select 
                        name="setor_id" 
                        defaultValue={editingFunc?.setor_id}
                        onValueChange={setSelectedSectorId}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {sectors?.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subcategoria">Subcategoria</Label>
                    {currentSectorSubcategorias.length > 0 ? (
                      <Select name="subcategoria" defaultValue={editingFunc?.subcategoria || "Geral"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Geral">Geral</SelectItem>
                          {currentSectorSubcategorias.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="subcategoria" name="subcategoria" defaultValue={editingFunc?.subcategoria} placeholder="Ex: Backend, Acadêmico..." />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" name="email" type="email" defaultValue={editingFunc?.email} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ramal">Ramal</Label>
                      <Input id="ramal" name="ramal" defaultValue={editingFunc?.ramal} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unidade">Unidade / Localização</Label>
                    <Input id="unidade" name="unidade" defaultValue={editingFunc?.unidade} />
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is_lider" checked={isLiderChecked} onCheckedChange={(checked) => setIsLiderChecked(!!checked)} />
                      <Label htmlFor="is_lider" className="text-sm font-bold cursor-pointer">Destaque como Liderança</Label>
                    </div>
                    {isLiderChecked && (
                      <div className="grid gap-2 pl-6">
                        <Label htmlFor="titulo_lider">Título Customizado (ex: Coordenador)</Label>
                        <Input id="titulo_lider" name="titulo_lider" defaultValue={editingFunc?.titulo_lider || "Líder de Setor"} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingFunc?.status || "ativo"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="foto_url">URL da Foto (3x4)</Label>
                      <Input id="foto_url" name="foto_url" defaultValue={editingFunc?.foto_url} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-11">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Colaborador</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Setor / Sub</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((f) => (
              <TableRow key={f.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-12 relative rounded-sm overflow-hidden border bg-slate-50 shrink-0 shadow-sm">
                      <NextImage 
                        src={f.foto_url || "https://picsum.photos/seed/placeholder/400/533"} 
                        alt={f.nome} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <span className="font-semibold text-sm flex items-center gap-1">
                      {f.nome}
                      {f.is_lider && <Crown size={12} className="text-amber-500" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{f.cargo}</span>
                    {f.is_lider && <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">{f.titulo_lider}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">
                      {sectors?.find(s => s.id === f.setor_id)?.nome || "-"}
                    </span>
                    {f.subcategoria && <span className="text-[10px] text-muted-foreground italic">{f.subcategoria}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={f.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px] uppercase font-black">
                    {f.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingFunc(f);
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
