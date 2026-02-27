
"use client"

import { useState } from "react";
import { Grid, Plus, Edit2, Trash2, Search, Loader2, FileText, AlertCircle, Upload } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemoFirebase, useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Setor, Funcionario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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

        let count = 0;
        const existingSectors = new Set(sectors?.map(s => s.nome.toLowerCase()) || []);

        for (const row of jsonData) {
          const nome = row.Nome || row.nome || row.NOME || row.Setor || row.setor;
          
          if (nome) {
            const normalizedName = nome.toString().trim();
            if (!existingSectors.has(normalizedName.toLowerCase())) {
              addDocumentNonBlocking(sectorsRef, {
                nome: normalizedName,
                data_criacao: new Date().toISOString(),
                createdAt: serverTimestamp(),
              });
              existingSectors.add(normalizedName.toLowerCase());
              count++;
            }
          }
        }

        toast({ title: "Sucesso", description: `${count} novos setores importados do Excel.` });
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
    const memberCount = employees?.filter(f => f.setor_ids && f.setor_ids.includes(id)).length || 0;
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
          <p className="text-muted-foreground">Organize os departamentos da sua empresa.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11">
                <FileText className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Importar Lista de Setores</DialogTitle>
                <DialogDescription>
                  Carregue um arquivo Excel com a lista de novos setores.
                </DialogDescription>
              </DialogHeader>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  A planilha deve ter uma coluna chamada <b>Nome</b> ou <b>Setor</b>.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="excel-file-sectors">Arquivo da Planilha</Label>
                  <Input 
                    id="excel-file-sectors" 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleExcelUpload} 
                  className="w-full"
                  disabled={!excelFile || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Processar Planilha
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
                  <Button type="submit" className="w-full">Salvar Setor</Button>
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
              const count = employees?.filter(f => f.setor_ids && f.setor_ids.includes(setor.id)).length || 0;
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
