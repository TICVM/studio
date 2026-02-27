
"use client"

import { useState } from "react";
import { MOCK_SETORES, MOCK_FUNCIONARIOS } from "@/lib/mock-data";
import { Grid, Plus, Edit2, Trash2, Search } from "lucide-react";
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

export default function SetoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredSetores = MOCK_SETORES.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Setores</h1>
          <p className="text-muted-foreground">Gerencie as divisões da empresa.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="mr-2 h-4 w-4" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Setor</DialogTitle>
              <DialogDescription>
                Informe o nome do novo setor que deseja cadastrar no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Setor</Label>
                <Input id="name" placeholder="Ex: Financeiro" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar Setor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSetores.map((setor) => {
              const count = MOCK_FUNCIONARIOS.filter(f => f.setor_id === setor.id).length;
              return (
                <TableRow key={setor.id}>
                  <TableCell className="font-medium text-muted-foreground">#{setor.id}</TableCell>
                  <TableCell className="font-semibold text-primary">{setor.nome}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(setor.data_criacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
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
            Nenhum setor encontrado com este nome.
          </div>
        )}
      </div>
    </div>
  );
}
