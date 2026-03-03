
"use client"

import { useState, useEffect } from "react";
import { Grid, Plus, Edit2, Trash2, Search, Loader2, FileText, Upload, Tags, LayoutList, LayoutGrid, Columns } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [layoutMode, setLayoutMode] = useState<'stack' | 'grid'>('stack');
  const [gridColumns, setGridColumns] = useState<string>("2");

  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);
  const employeesRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);

  const { data: sectors, isLoading: loadingSectors } = useCollection<Setor>(sectorsRef);
  const { data: employees } = useCollection<Funcionario>(employeesRef);

  useEffect(() => {
    if (editingSector) {
      setLayoutMode(editingSector.layoutSubcategorias || 'stack');
      setGridColumns(String(editingSector.colunasGrid || "2"));
    } else {
      setLayoutMode('stack');
      setGridColumns("2");
    }
  }, [editingSector]);

  const filteredSetores = (sectors || [])
    .filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const orderA = a.ordem ?? 999;
      const orderB = b.ordem ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.nome.localeCompare(b.nome);
    });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;
    const ordem = Number(formData.get("ordem")) || 0;
    const subcatsRaw = formData.get("subcategorias") as string;
    
    const subcategorias = subcatsRaw 
      ? subcatsRaw.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const data = { 
      nome, 
      ordem,
      subcategorias,
      layoutSubcategorias: layoutMode,
      colunasGrid: layoutMode === 'grid' ? Number(gridColumns) : 1
    };

    if (editingSector) {
      updateDocumentNonBlocking(doc(firestore, "sectors", editingSector.id), data);
      toast({ title: "Sucesso", description: "Setor atualizado." });
    } else {
      addDocumentNonBlocking(sectorsRef, {
        ...data,
        data_criacao: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso", description: "Setor criado." });
    }

    setIsDialogOpen(false);
    setEditingSector(null);
  };

  const openEdit = (setor: Setor) => {
    setEditingSector(setor);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const memberCount = employees?.filter(f => f.setor_id === id).length || 0;
    if (memberCount > 0) {
      toast({ variant: "destructive", title: "Ação negada", description: "O setor possui membros vinculados. Remova-os antes de excluir o setor." });
      return;
    }
    const docRef = doc(firestore, "sectors", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Excluído", description: "Setor removido com sucesso." });
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
              ordem: Number(row.Ordem) || 0,
              subcategorias: row.Subcategorias?.split(',').map((s: string) => s.trim()) || [],
              layoutSubcategorias: 'stack',
              colunasGrid: 1,
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
          <p className="text-muted-foreground">Gerencie departamentos e sua ordem de exibição.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 shadow-sm"><FileText className="mr-2 h-4 w-4" />Importar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Setores</DialogTitle>
                <DialogDescription>Use uma planilha com as colunas Nome, Ordem e Subcategorias.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input type="file" accept=".xlsx, .xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
              </div>
              <DialogFooter>
                <Button onClick={handleExcelUpload} disabled={!excelFile || isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Processar Planilha"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSector(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="h-11 shadow-md"><Plus className="mr-2 h-4 w-4" />Novo Setor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingSector ? "Editar Setor" : "Criar Novo Setor"}</DialogTitle>
                  <DialogDescription>A ordem define a sequência no Carômetro (números menores aparecem primeiro).</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 grid gap-2">
                      <Label htmlFor="nome">Nome do Setor</Label>
                      <Input id="nome" name="nome" defaultValue={editingSector?.nome} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input id="ordem" name="ordem" type="number" defaultValue={editingSector?.ordem || 0} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Layout das Subcategorias</Label>
                    <RadioGroup 
                      value={layoutMode} 
                      onValueChange={(val: 'stack' | 'grid') => setLayoutMode(val)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent/5">
                        <RadioGroupItem value="stack" id="layout1" />
                        <Label htmlFor="layout1" className="flex items-center gap-2 cursor-pointer font-bold">
                          <LayoutList size={16} />
                          Abaixo
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent/5">
                        <RadioGroupItem value="grid" id="layout2" />
                        <Label htmlFor="layout2" className="flex items-center gap-2 cursor-pointer font-bold">
                          <LayoutGrid size={16} />
                          Ao Lado
                        </Label>
                      </div>
                    </RadioGroup>

                    {layoutMode === 'grid' && (
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-dashed">
                        <div className="flex-1 space-y-1">
                          <Label className="flex items-center gap-2"><Columns size={14} /> Colunas (Desktop)</Label>
                          <p className="text-[10px] text-muted-foreground">Quantas subcategorias lado a lado?</p>
                        </div>
                        <Select value={gridColumns} onValueChange={setGridColumns}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Coluna</SelectItem>
                            <SelectItem value="2">2 Colunas</SelectItem>
                            <SelectItem value="3">3 Colunas</SelectItem>
                            <SelectItem value="4">4 Colunas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subcategorias" className="flex items-center gap-2"><Tags size={14} /> Subcategorias (separadas por vírgula)</Label>
                    <Input id="subcategorias" name="subcategorias" placeholder="Ex: Backend, Frontend, DevOps" defaultValue={editingSector?.subcategorias?.join(", ")} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" className="w-full h-11">Salvar Alterações</Button></DialogFooter>
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
              placeholder="Pesquisar departamentos..." 
              className="pl-10"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-16 text-center">Ordem</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Subcategorias</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead className="text-center">Equipe</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSetores.map((setor) => {
              const count = employees?.filter(f => f.setor_id === setor.id).length || 0;
              return (
                <TableRow key={setor.id} className="group">
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono text-[10px]">{setor.ordem ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{setor.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {setor.subcategorias && setor.subcategorias.length > 0 ? (
                        setor.subcategorias.map(sub => <Badge key={sub} variant="secondary" className="text-[9px] uppercase font-bold">{sub}</Badge>)
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {setor.layoutSubcategorias === 'grid' ? (
                          <><LayoutGrid size={14} /> Ao Lado</>
                        ) : (
                          <><LayoutList size={14} /> Abaixo</>
                        )}
                      </div>
                      {setor.layoutSubcategorias === 'grid' && (
                        <span className="text-[10px] font-bold text-primary">{setor.colunasGrid || 2} colunas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {count}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(setor)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente excluir o setor "{setor.nome}"? Esta ação não poderá ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(setor.id)} className="bg-destructive text-white hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
