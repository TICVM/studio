
"use client"

import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { EmployeeCard } from "@/components/carometro/EmployeeCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Funcionario, Setor } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("all");
  const firestore = useFirestore();

  const activeEmployeesQuery = useMemoFirebase(() => {
    return query(collection(firestore, "employees"), where("status", "==", "ativo"));
  }, [firestore]);

  const sectorsQuery = useMemoFirebase(() => {
    return collection(firestore, "sectors");
  }, [firestore]);

  const { data: employees, isLoading: loadingEmployees } = useCollection<Funcionario>(activeEmployeesQuery);
  const { data: sectors, isLoading: loadingSectors } = useCollection<Setor>(sectorsQuery);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((f) => {
      const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           f.cargo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSetor = selectedSetor === "all" || f.setor_id === selectedSetor;
      return matchesSearch && matchesSetor;
    });
  }, [employees, searchTerm, selectedSetor]);

  const groupedEmployees = useMemo(() => {
    if (!sectors) return [];
    const relevantSectors = selectedSetor === "all" 
      ? sectors 
      : sectors.filter(s => s.id === selectedSetor);

    const sortedSectors = [...relevantSectors].sort((a, b) => {
      const orderA = a.ordem ?? 999;
      const orderB = b.ordem ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.nome.localeCompare(b.nome);
    });

    return sortedSectors.map(sector => {
      const sectorFuncs = filteredEmployees.filter(f => f.setor_id === sector.id);
      
      const subGroupsMap = new Map<string, Funcionario[]>();
      sectorFuncs.forEach(f => {
        const sub = f.subcategoria || "Geral";
        if (!subGroupsMap.has(sub)) subGroupsMap.set(sub, []);
        subGroupsMap.get(sub)!.push(f);
      });

      const subGroups = Array.from(subGroupsMap.entries()).map(([name, funcs]) => ({
        name,
        funcionarios: funcs.sort((a, b) => {
          if (a.is_lider && !b.is_lider) return -1;
          if (!a.is_lider && b.is_lider) return 1;
          return a.nome.localeCompare(b.nome);
        })
      })).sort((a, b) => {
        if (a.name === "Geral") return -1;
        if (b.name === "Geral") return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        ...sector,
        subGroups
      };
    }).filter(group => group.subGroups.some(sg => sg.funcionarios.length > 0));
  }, [filteredEmployees, sectors, selectedSetor]);

  const getGridColsClass = (cols: number | undefined) => {
    switch(cols) {
      case 1: return "lg:grid-cols-1";
      case 2: return "lg:grid-cols-2";
      case 3: return "lg:grid-cols-3";
      case 4: return "lg:grid-cols-4";
      default: return "lg:grid-cols-2";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-12">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-primary tracking-tight">Equipe Corporativa</h1>
            <p className="text-muted-foreground text-sm font-medium">Encontre colaboradores, ramais e informações de contato.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nome ou cargo..." 
                className="pl-10 h-11 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-56">
              <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar Setor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  {sectors?.sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {(loadingEmployees || loadingSectors) ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <div className="space-y-20">
            {groupedEmployees.length > 0 ? (
              groupedEmployees.map(sectorGroup => (
                <section key={sectorGroup.id} className="space-y-10">
                  {/* Cabeçalho do Setor */}
                  <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-primary pr-2 whitespace-nowrap uppercase tracking-tighter border-b-4 border-primary/20 pb-2">
                      {sectorGroup.nome}
                    </h2>
                    <div className="h-px w-full bg-slate-200/60" />
                  </div>
                  
                  {/* Grid das Subcategorias */}
                  <div className={cn(
                    "gap-x-10 gap-y-16",
                    sectorGroup.layoutSubcategorias === 'grid' 
                      ? cn("grid grid-cols-1", getGridColsClass(sectorGroup.colunasGrid))
                      : "flex flex-col"
                  )}>
                    {sectorGroup.subGroups.map(sub => (
                      <div key={sub.name} className="space-y-8">
                        {/* Título da Subcategoria (com o ponto indicador da imagem) */}
                        {sub.name !== "Geral" && (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                              {sub.name}
                            </h3>
                          </div>
                        )}

                        {/* Grade de Funcionários - Inteligente para não esmagar os cards */}
                        <div className={cn(
                          "grid gap-8",
                          sectorGroup.layoutSubcategorias === 'grid'
                            ? "grid-cols-1" // Em layout de grade de subcategorias, mantemos funcionários em coluna única por padrão para preservar largura
                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                        )}>
                          {sub.funcionarios.map(f => (
                            <EmployeeCard 
                              key={f.id} 
                              funcionario={f} 
                              setor={sectorGroup}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-24 space-y-4 bg-white rounded-3xl border border-dashed">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Nenhum colaborador encontrado</h3>
                <p className="text-slate-400 text-sm">Tente outro nome ou mude os filtros de setor.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} PessoasEmpresa &bull; Carômetro Interno
          </p>
        </div>
      </footer>
    </div>
  );
}
