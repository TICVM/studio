
"use client"

import { MOCK_FUNCIONARIOS, MOCK_SETORES } from "@/lib/mock-data";
import { Users, Grid, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const totalFuncionarios = MOCK_FUNCIONARIOS.length;
  const totalAtivos = MOCK_FUNCIONARIOS.filter(f => f.status === 'ativo').length;
  const totalInativos = totalFuncionarios - totalAtivos;
  const totalSetores = MOCK_SETORES.length;

  const STATS = [
    { label: "Total Funcionários", value: totalFuncionarios, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Colaboradores Ativos", value: totalAtivos, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Setores", value: totalSetores, icon: Grid, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Inativos", value: totalInativos, icon: UserX, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Resumo das métricas da empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
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
              {[...MOCK_FUNCIONARIOS].reverse().slice(0, 5).map(f => (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0" />
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
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Setores Populosos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_SETORES.map(s => {
                const count = MOCK_FUNCIONARIOS.filter(f => f.setor_id === s.id).length;
                const percentage = (count / totalFuncionarios) * 100;
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
