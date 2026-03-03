
"use client"

import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { EmployeeCard } from "@/components/carometro/EmployeeCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, MapPin, X, Cake, Sparkles } from "lucide-react";
import { useMemoFirebase, useCollection, useFirestore, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Funcionario, Setor, SystemSettings } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import NextImage from "next/image";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("all");
  const [selectedUnidade, setSelectedUnidade] = useState("all");
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

  const today = new Date();
  const currentMonth = today.getUTCMonth(); // 0-11
  const currentDay = today.getUTCDate();

  // Extrair unidades únicas
  const unidadesDisponiveis = useMemo(() => {
    if (!employees) return [];
    const units = employees
      .map(f => f.unidade)
      .filter((u): u is string => !!u && u.trim() !== "");
    return Array.from(new Set(units)).sort();
  }, [employees]);

  // Aniversariantes do Mês
  const anniversaries = useMemo(() => {
    if (!employees || !settings?.showBirthdays) return [];
    return employees.filter(f => {
      if (!f.data_nascimento) return false;
      const birthDate = new Date(f.data_nascimento);
      const birthMonth = birthDate.getUTCMonth();
      return birthMonth === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.data_nascimento!).getUTCDate();
      const dayB = new Date(b.data_nascimento!).getUTCDate();
      return dayA - dayB;
    });
  }, [employees, settings?.showBirthdays, currentMonth]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((f) => {
      const nameMatch = f.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const jobMatch = f.cargo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || jobMatch;
      const matchesSetor = selectedSetor === "all" || f.setor_id === selectedSetor;
      const matchesUnidade = selectedUnidade === "all" || f.unidade === selectedUnidade;
      return matchesSearch && matchesSetor && matchesUnidade;
    });
  }, [employees, searchTerm, selectedSetor, selectedUnidade]);

  const hasActiveFilters = searchTerm !== "" || selectedSetor !== "all" || selectedUnidade !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSetor("all");
    setSelectedUnidade("all");
  };

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

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-10">
        {/* Aniversariantes do Mês (Destaque Festivo) */}
        {settings?.showBirthdays && anniversaries.length > 0 && !hasActiveFilters && (
          <section className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-6 md:p-8 rounded-[2rem] border border-pink-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-600">
                  <Cake size={20} className="animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Celebração do Mês</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-800">
                  Aniversariantes de <span className="text-pink-600 underline decoration-pink-200 decoration-4 underline-offset-4">{monthNames[currentMonth]}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-pink-100/50 self-start sm:self-auto">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Parabéns aos colegas!</span>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-hide -mx-4 px-4">
              {anniversaries.map(f => {
                const birthDay = new Date(f.data_nascimento!).getUTCDate();
                const isToday = birthDay === currentDay;
                return (
                  <div key={f.id} className="flex-shrink-0 group">
                    <div className={cn(
                      "relative w-36 h-48 rounded-[1.5rem] overflow-hidden border-4 transition-all duration-500",
                      isToday ? "border-pink-400 shadow-xl shadow-pink-200 scale-105" : "border-white shadow-md group-hover:scale-105"
                    )}>
                      <NextImage 
                        src={f.foto_url || "https://picsum.photos/seed/placeholder/400/533"} 
                        alt={f.nome} 
                        fill 
                        className="object-cover"
                      />
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end min-h-[60%]",
                        isToday ? "bg-gradient-to-t from-pink-600/90 via-pink-500/40 to-transparent" : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                      )}>
                        <p className="text-xs font-black text-white truncate mb-0.5">{f.nome.split(' ')[0]}</p>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                            isToday ? "bg-white text-pink-600 animate-pulse" : "bg-white/20 text-white backdrop-blur-md"
                          )}>
                            {isToday ? "Hoje! 🎉" : `Dia ${birthDay}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Filtros e Cabeçalho Principal */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between p-6 rounded-xl shadow-sm border border-slate-100" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div className="space-y-1 flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
              {settings?.heroTitle || settings?.systemName || "Equipe Corporativa"}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                {settings?.showCount !== false && (
                  <span className="font-bold mr-1">{filteredEmployees.length}</span>
                )}
                {settings?.countLabel || "colaboradores encontrados."}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-7 px-2 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            <div className="relative w-full sm:flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nome ou cargo..." 
                className="pl-9 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-44">
                <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
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

              <div className="w-full sm:w-44">
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger className="h-11 border-primary/20">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <SelectValue placeholder="Unidade" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Unidades</SelectItem>
                    {unidadesDisponiveis.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                          <h3 className="font-bold uppercase tracking-widest pl-1" style={{ 
                            fontSize: 'var(--subcategory-font-size)',
                            color: 'hsl(var(--subcategory-color, var(--primary)))' 
                          }}>
                            {sub.name}
                          </h3>
                        )}

                        {/* Grade de Funcionários */}
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
                <p className="text-slate-300 text-sm">Refine sua busca ou filtros por setor e unidade.</p>
                <Button variant="link" onClick={clearFilters} className="mt-4 text-primary">
                  Ver todos os colaboradores
                </Button>
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
