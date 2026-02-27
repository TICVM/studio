
"use client"

import { useState } from "react";
import Image from "next/image";
import { Users, Plus, Edit2, Trash2, Search, FileText, Loader2, AlertCircle, Upload } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Funcionario, Setor } from "@/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function FuncionariosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const employeesRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);

  const { data: employees, isLoading: loadingEmployees } = useCollection<Funcionario>(employeesRef);
  const { data: sectors } = useCollection<Setor>(sectorsRef);

  const filteredEmployees = employees?.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      cargo: formData.get("cargo") as string,
      setor_id: formData.get("setor_id") as string,
      status: formData.get("status") as "ativo" | "inativo",
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

        if (jsonData.length === 0) {
          toast({ variant: "destructive", title: "Erro", description: "A planilha está vazia." });
          setIsProcessing(false);
          return;
        }

        const sectorMap = new Map<string, string>();
        sectors?.forEach(s => sectorMap.set(s.nome.toLowerCase(), s.id));

        let successCount = 0;

        for (const row of jsonData) {
          const nome = row.Nome || row.nome || row.NOME;
          const cargo = row.Cargo || row.cargo || row.CARGO;
          const setorNome = row.Setor || row.setor || row.SETOR;
          const statusRaw = row.Status || row.status || row.STATUS;
          const fotoUrl = row.Foto || row.foto || row.FOTO || row.FotoURL || row.foto_url;

          if (nome && cargo) {
            let targetSectorId = "";
            
            if (setorNome) {
              const normalizedSetor = setorNome.toString().toLowerCase().trim();
              const existingId = sectorMap.get(normalizedSetor);
              
              if (existingId) {
                targetSectorId = existingId;
              } else {
                const newSectorRef = doc(collection(firestore, "sectors"));
                targetSectorId = newSectorRef.id;
                setDocumentNonBlocking(newSectorRef, {
                  nome: setorNome,
                  data_criacao: new Date().toISOString(),
                  createdAt: serverTimestamp(),
                }, { merge: true });
                sectorMap.set(normalizedSetor, targetSectorId);
              }
            }

            const status = (statusRaw?.toString().toLowerCase() === 'inativo') ? 'inativo' : 'ativo';
            const finalFotoUrl = fotoUrl || `https://picsum.photos/seed/${Math.random()}/400/533`;

            addDocumentNonBlocking(employeesRef, {
              nome,
              cargo,
              setor_id: targetSectorId,
              status,
              foto_url: finalFotoUrl,
              data_criacao: new Date().toISOString(),
              createdAt: serverTimestamp(),
            });
            successCount++;
          }
        }

        toast({ title: "Sucesso", description: `${successCount} colaboradores importados.` });
        setIsBulkDialogOpen(false);
        setExcelFile(null);
      } catch (error) {
        console.error("Erro ao processar Excel:", error);
        toast({ variant: "destructive", title: "Erro", description: "Falha ao ler o arquivo Excel." });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(excelFile);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este colaborador?")) {
      deleteDocumentNonBlocking(doc(firestore, "employees", id));
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
          <p className="text-muted-foreground">Gerencie sua equipe via cadastro manual ou planilha Excel.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11">
                <FileText className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Importar Planilha</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo .xlsx ou .xls para importar.
                </DialogDescription>
              </DialogHeader>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  A planilha deve conter as colunas:<br/>
                  <b>Nome | Cargo | Setor | Status | Foto</b><br/>
                  <i>* Setores novos serão criados automaticamente.</i>
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="excel-file">Arquivo Excel</Label>
                  <Input 
                    id="excel-file" 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleExcelUpload} 
                  className="w-full h-11"
                  disabled={!excelFile || isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isProcessing ? "Processando..." : "Importar Planilha"}
                </Button>
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
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingFunc ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do colaborador abaixo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" name="nome" defaultValue={editingFunc?.nome} required placeholder="Ex: Roberto Justos" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input id="cargo" name="cargo" defaultValue={editingFunc?.cargo} required placeholder="Ex: Desenvolvedor" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="setor_id">Setor</Label>
                      <Select name="setor_id" defaultValue={editingFunc?.setor_id}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors?.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingFunc?.status || "ativo"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="foto_url">URL da Foto</Label>
                    <Input id="foto_url" name="foto_url" defaultValue={editingFunc?.foto_url} placeholder="https://..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-11">
                    {editingFunc ? "Salvar Alterações" : "Cadastrar Colaborador"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou cargo..." 
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
              <TableHead>Setor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((f) => {
              const setor = sectors?.find(s => s.id === f.setor_id);
              return (
                <TableRow key={f.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 relative rounded-sm overflow-hidden border bg-slate-50 shadow-sm">
                        <Image 
                          src={f.foto_url || "https://picsum.photos/seed/placeholder/400/533"} 
                          alt={f.nome} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <span className="font-semibold text-sm">{f.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{f.cargo}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {setor?.nome || "Sem Setor"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      f.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {f.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingFunc(f);
                        setIsDialogOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum colaborador encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
