"use client"

import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, Grid, UserCheck, UserX, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Funcionario, Setor } from "@/types";

export default function DashboardPage() {
  const firestore = useFirestore();

  const funcionariosRef = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const setoresRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);

  const { data: funcionarios, isLoading: loadingFuncs } = useCollection<Funcionario>(funcionariosRef);
  const { data: setores, isLoading: loadingSetores } = useCollection<Setor>(setoresRef);

  const stats = {
    total: funcionarios?.length || 0,
    ativos: funcionarios?.filter(f => f.status === 'ativo').length || 0,
    inativos: (funcionarios?.length || 0) - (funcionarios?.filter(f => f.status === 'ativo').length || 0),
    setores: setores?.length || 0,
  };

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Resumo das métricas em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
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
          <CardHeader>
            <CardTitle className="text-lg">Cadastros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {funcionarios && funcionarios.length > 0 ? (
                [...funcionarios]
                  .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
                  .slice(0, 5)
                  .map(f => (
                    <div key={f.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden relative">
                          {f.foto_url ? (
                            <img src={f.foto_url} alt={f.nome} className="object-cover w-full h-full" />
                          ) : (
                            <Users size={20} className="m-auto mt-2 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.cargo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {new Date(f.data_criacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum funcionário cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Setores Populosos</CardTitle>
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
                        <span className="font-medium">{s.nome}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Crie setores para ver o ranking.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
