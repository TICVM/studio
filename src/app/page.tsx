
"use client"

import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { MOCK_FUNCIONARIOS, MOCK_SETORES } from "@/lib/mock-data";
import { EmployeeCard } from "@/components/carometro/EmployeeCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("all");

  const filteredFuncionarios = useMemo(() => {
    return MOCK_FUNCIONARIOS.filter((f) => {
      const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           f.cargo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSetor = selectedSetor === "all" || f.setor_id === selectedSetor;
      return matchesSearch && matchesSetor && f.status === 'ativo';
    });
  }, [searchTerm, selectedSetor]);

  // Group by sector
  const groupedFuncionarios = useMemo(() => {
    const sectors = selectedSetor === "all" 
      ? MOCK_SETORES 
      : MOCK_SETORES.filter(s => s.id === selectedSetor);

    return sectors.map(sector => ({
      ...sector,
      funcionarios: filteredFuncionarios.filter(f => f.setor_id === sector.id)
    })).filter(group => group.funcionarios.length > 0);
  }, [filteredFuncionarios, selectedSetor]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-primary tracking-tight">Carômetro</h1>
            <p className="text-muted-foreground">Conheça nossa equipe e colaboradores.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-56">
              <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Setor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  {MOCK_SETORES.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {groupedFuncionarios.length > 0 ? (
            groupedFuncionarios.map(group => (
              <section key={group.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-primary pr-4 whitespace-nowrap">
                    {group.nome}
                  </h2>
                  <div className="h-px w-full bg-border" />
                  <span className="text-sm font-medium text-muted-foreground px-4 bg-background">
                    {group.funcionarios.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.funcionarios.map(f => (
                    <EmployeeCard 
                      key={f.id} 
                      funcionario={f} 
                      setor={MOCK_SETORES.find(s => s.id === f.setor_id)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum colaborador encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PessoasEmpresa. Sistema de Gestão Interna.
          </p>
        </div>
      </footer>
    </div>
  );
}
