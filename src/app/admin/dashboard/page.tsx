
"use client"

import { useMemo } from "react";
import NextImage from "next/image";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, Grid, UserCheck, UserX, Clock, Loader2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Funcionario, Setor } from "@/types";

export default function DashboardPage() {
  const firestore = useFirestore();

  const funcionariosRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const setoresRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);

  const { data: funcionarios, isLoading: loadingFuncs } = useCollection<Funcionario>(funcionariosRef);
  const { data: setores, isLoading: loadingSetores } = useCollection<Setor>(setoresRef);

  const stats = useMemo(() => {
    const total = funcionarios?.length || 0;
    const ativos = funcionarios?.filter(f => f.status === 'ativo').length || 0;
    const inativos = total - ativos;
    const totalSetores = setores?.length || 0;

    return { total, ativos, inativos, setores: totalSetores };
  }, [funcionarios, setores]);

  const STATS_CONFIG = [
    { label: "Total Funcionários", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Colaboradores Ativos", value: stats.ativos, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Setores", value: stats.setores, icon: Grid, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Inativos", value: stats.inativos, icon: UserX, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  if (loadingFuncs || loadingSetores) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da estrutura organizacional.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ArrowUpRight size={14} />
          Sincronizado em tempo real
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1 text-primary">{stat.value}</h3>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Cadastros Recentes</CardTitle>
            <Clock size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {funcionarios && funcionarios.length > 0 ? (
                [...funcionarios]
                  .sort((a, b) => {
                    const dateA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
                    const dateB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
                    return dateB - dateA;
                  })
                  .slice(0, 5)
                  .map(f => (
                    <div key={f.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-9 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden relative border border-slate-200">
                          <NextImage 
                            src={f.foto_url || "https://picsum.photos/seed/placeholder/400/533"} 
                            alt={f.nome} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.cargo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Cadastrado em</p>
                        <p className="text-xs font-medium">
                          {f.data_criacao ? new Date(f.data_criacao).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                  Nenhum colaborador cadastrado ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {setores && setores.length > 0 ? (
                setores.map(s => {
                  const count = funcionarios?.filter(f => f.setor_id === s.id).length || 0;
                  const total = funcionarios?.length || 1;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={s.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{s.nome}</span>
                        <span className="text-primary font-bold">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                  Crie setores para visualizar a distribuição.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
