
"use client"

import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { EmployeeCard } from "@/components/carometro/EmployeeCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { useMemoFirebase, useCollection, useFirestore, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Funcionario, Setor, SystemSettings } from "@/types";
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

  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

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

  const headerStyle = settings?.headerStyle || 'line_right';
  const headerFontSize = settings?.headerFontSize || 24;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 rounded-xl shadow-sm border border-slate-100" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
              {settings?.systemName || "Equipe Corporativa"}
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              Consulte ramais e informações dos colaboradores.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Setor" />
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
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
          </div>
        ) : (
          <div className="space-y-16">
            {groupedEmployees.length > 0 ? (
              groupedEmployees.map(sectorGroup => (
                <section key={sectorGroup.id} className="space-y-6">
                  {/* Cabeçalho do Setor Configurável */}
                  <div className={cn(
                    "flex items-center gap-4 transition-all",
                    headerStyle === 'box_background' && "p-4 rounded-xl",
                    headerStyle === 'full_underline' && "border-b-2 pb-2"
                  )} style={{ 
                    backgroundColor: headerStyle === 'box_background' ? 'hsl(var(--primary))' : 'transparent',
                    borderBottomColor: headerStyle === 'full_underline' ? 'hsl(var(--primary))' : 'transparent'
                  }}>
                    <h2 className="font-black tracking-tight" style={{ 
                      fontSize: headerFontSize, 
                      color: headerStyle === 'box_background' ? 'white' : 'hsl(var(--sector-header-color, var(--primary)))' 
                    }}>
                      {sectorGroup.nome}
                    </h2>
                    {headerStyle === 'line_right' && <div className="h-px flex-1 bg-slate-200" />}
                  </div>
                  
                  {/* Grid das Subcategorias */}
                  <div className={cn(
                    "gap-6",
                    sectorGroup.layoutSubcategorias === 'grid' 
                      ? cn("grid grid-cols-1", getGridColsClass(sectorGroup.colunasGrid))
                      : "flex flex-col"
                  )}>
                    {sectorGroup.subGroups.map(sub => (
                      <div key={sub.name} className="space-y-4">
                        {/* Título da Subcategoria */}
                        {sub.name !== "Geral" && (
                          <h3 className="text-sm font-bold uppercase tracking-widest pl-1" style={{ color: 'hsl(var(--subcategory-color, var(--primary)))' }}>
                            {sub.name}
                          </h3>
                        )}

                        {/* Grade de Funcionários - Sincronizada com o layout do setor */}
                        <div className={cn(
                          "grid gap-8",
                          sectorGroup.layoutSubcategorias === 'grid'
                            ? (sectorGroup.colunasGrid && sectorGroup.colunasGrid >= 3 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")
                            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        )}>
                          {sub.funcionarios.map(f => (
                            <div key={f.id} className="flex justify-center h-full">
                              <EmployeeCard 
                                funcionario={f} 
                                setor={sectorGroup}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-20 rounded-xl border border-dashed" style={{ backgroundColor: 'hsl(var(--card))' }}>
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-400">Nenhum resultado</h3>
                <p className="text-slate-300 text-sm">Refine sua busca ou filtros.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t py-8 mt-16" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest" style={{ color: 'hsl(var(--foreground))' }}>
            &copy; {new Date().getFullYear()} {settings?.systemName || "PessoasEmpresa"} &bull; Carômetro
          </p>
        </div>
      </footer>
    </div>
  );
}
