
"use client"

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Users, Plus, Edit2, Trash2, Search, FileText, Loader2, AlertCircle, Upload, Crown, Mail, Hash, Building, CheckCircle2, ChevronDown, X, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Funcionario, Setor } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  const [isLiderChecked, setIsLiderChecked] = useState(false);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);

  const employeesRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);

  const { data: employees, isLoading: loadingEmployees } = useCollection<Funcionario>(employeesRef);
  const { data: sectors } = useCollection<Setor>(sectorsRef);

  useEffect(() => {
    if (isDialogOpen) {
      if (editingFunc) {
        setIsLiderChecked(!!editingFunc.is_lider);
        setSelectedSectorIds(editingFunc.setor_ids || []);
      } else {
        setIsLiderChecked(false);
        setSelectedSectorIds([]);
      }
    }
  }, [editingFunc, isDialogOpen]);

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
    if (selectedSectorIds.length === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione pelo menos um setor." });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      cargo: formData.get("cargo") as string,
      setor_ids: selectedSectorIds,
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

        const sectorMap = new Map<string, string>();
        sectors?.forEach(s => sectorMap.set(s.nome.toLowerCase().trim(), s.id));

        let successCount = 0;

        for (const row of jsonData) {
          const nome = row.Nome || row.nome || row.NOME;
          const cargo = row.Cargo || row.cargo || row.CARGO;
          const setorString = row.Setor || row.setor || row.SETOR || "";
          const statusRaw = row.Status || row.status || row.STATUS;
          const fotoUrl = row.Foto || row.foto || row.FOTO || row.FotoURL || row.foto_url;
          const liderRaw = row.Lider || row.Líder || row.lider || row.lideranca;
          const tituloLider = row.TituloLider || row.titulo_lider || row.Titulo_Lider || row.cargo_lider;
          const email = row.Email || row.email || row.EMAIL || row.Correio;
          const ramal = row.Ramal || row.ramal || row.RAMAL || row.Extensao;
          const unidade = row.Unidade || row.unidade || row.UNIDADE || row.Filial;

          if (nome && cargo) {
            const rowSectorNames = setorString.toString().split(/[,;]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
            const targetSectorIds: string[] = [];

            for (const sName of rowSectorNames) {
              const existingId = sectorMap.get(sName);
              if (existingId) {
                targetSectorIds.push(existingId);
              } else {
                const newSectorRef = doc(collection(firestore, "sectors"));
                const sectorNameRaw = sName.charAt(0).toUpperCase() + sName.slice(1);
                targetSectorIds.push(newSectorRef.id);
                setDocumentNonBlocking(newSectorRef, {
                  nome: sectorNameRaw,
                  data_criacao: new Date().toISOString(),
                  createdAt: serverTimestamp(),
                }, { merge: true });
                sectorMap.set(sName, newSectorRef.id);
              }
            }

            const status = (statusRaw?.toString().toLowerCase() === 'inativo') ? 'inativo' : 'ativo';
            const isLider = liderRaw?.toString().toLowerCase() === 'sim' || liderRaw === true || liderRaw === 1 || liderRaw === 'S';
            const finalFotoUrl = fotoUrl || `https://picsum.photos/seed/${Math.random()}/400/533`;

            addDocumentNonBlocking(employeesRef, {
              nome,
              cargo,
              setor_ids: targetSectorIds,
              status,
              is_lider: !!isLider,
              titulo_lider: isLider ? (tituloLider?.toString() || "Líder de Setor") : "",
              foto_url: finalFotoUrl,
              email: email?.toString() || "",
              ramal: ramal?.toString() || "",
              unidade: unidade?.toString() || "",
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

  const toggleSectorSelection = (id: string) => {
    setSelectedSectorIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
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
                <DialogDescription>
                  Selecione um arquivo .xlsx para importar.
                </DialogDescription>
              </DialogHeader>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  Colunas esperadas:<br/>
                  <b>Nome | Cargo | Setor | Status | Líder | TituloLider | Foto | Email | Ramal | Unidade</b><br/>
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
            if (!open) {
              setEditingFunc(null);
            }
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
                      <Label>Setores (Múltipla Escolha)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal text-left h-auto min-h-[40px] py-2">
                            <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                              {selectedSectorIds.length > 0 ? (
                                selectedSectorIds.map(id => {
                                  const s = sectors?.find(sec => sec.id === id);
                                  return (
                                    <Badge key={id} variant="secondary" className="text-[10px] px-2 py-0 h-5">
                                      {s?.nome}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-muted-foreground">Selecione os setores...</span>
                              )}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <ScrollArea className="h-60">
                            <div className="p-2 space-y-1">
                              {sectors?.map((s) => (
                                <div 
                                  key={s.id} 
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-50 transition-colors",
                                    selectedSectorIds.includes(s.id) && "bg-slate-100"
                                  )}
                                  onClick={() => toggleSectorSelection(s.id)}
                                >
                                  <div className={cn(
                                    "h-4 w-4 border rounded-sm flex items-center justify-center transition-colors",
                                    selectedSectorIds.includes(s.id) ? "bg-primary border-primary" : "border-slate-300 bg-white"
                                  )}>
                                    {selectedSectorIds.includes(s.id) && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium">{s.nome}</span>
                                </div>
                              ))}
                              {sectors?.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Nenhum setor cadastrado.</p>}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="email" name="email" type="email" className="pl-10" defaultValue={editingFunc?.email} placeholder="email@empresa.com" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ramal">Ramal</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="ramal" name="ramal" className="pl-10" defaultValue={editingFunc?.ramal} placeholder="Ex: 2024" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unidade">Unidade / Localização</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="unidade" name="unidade" className="pl-10" defaultValue={editingFunc?.unidade} placeholder="Ex: Sede Central - Bloco A" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_lider" 
                        checked={isLiderChecked} 
                        onCheckedChange={(checked) => setIsLiderChecked(!!checked)} 
                      />
                      <Label htmlFor="is_lider" className="text-sm font-bold cursor-pointer">
                        Destaque como Liderança (Aparece no topo do setor)
                      </Label>
                    </div>
                    {isLiderChecked && (
                      <div className="grid gap-2 pl-6 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="titulo_lider">Título da Liderança Personalizado</Label>
                        <Input 
                          id="titulo_lider" 
                          name="titulo_lider" 
                          defaultValue={editingFunc?.titulo_lider || "Líder de Setor"} 
                          placeholder="Ex: Coordenador de Área, Diretor, etc." 
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
        <div className="p-4 border-b">
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
              <TableHead>Setores</TableHead>
              <TableHead>Contatos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((f) => {
              const employeeSectors = sectors?.filter(s => f.setor_ids?.includes(s.id));
              return (
                <TableRow key={f.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 relative rounded-sm overflow-hidden border bg-slate-50 shadow-sm shrink-0">
                        <Image 
                          src={f.foto_url || "https://picsum.photos/seed/placeholder/400/533"} 
                          alt={f.nome} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm flex items-center gap-1">
                          {f.nome}
                          {f.is_lider && <Crown size={12} className="text-amber-500" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{f.unidade}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{f.cargo}</span>
                      {f.is_lider && f.titulo_lider && (
                        <span className="text-[9px] font-bold text-amber-600 uppercase">{f.titulo_lider}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employeeSectors && employeeSectors.length > 0 ? (
                        employeeSectors.map(s => (
                          <span key={s.id} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            {s.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {f.email && <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{f.email}</span>}
                      {f.ramal && <span className="text-[10px] font-bold text-primary">Ramal: {f.ramal}</span>}
                    </div>
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
