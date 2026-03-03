
"use client"

import Image from "next/image";
import { Funcionario, Setor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Mail, Hash, Building } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface EmployeeCardProps {
  funcionario: Funcionario;
  setor?: Setor;
}

export function EmployeeCard({ funcionario, setor }: EmployeeCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card 
        onClick={() => setIsOpen(true)}
        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white h-full flex flex-col shadow-sm"
      >
        <CardContent className="p-6 flex flex-col items-center text-center flex-1 space-y-4">
          {/* Container da Foto (3:4 aspect ratio) */}
          <div className="relative w-3/4 aspect-[3/4] rounded-md overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={funcionario.foto_url || "https://picsum.photos/seed/placeholder/400/533"}
              alt={funcionario.nome}
              fill
              className="object-cover"
              data-ai-hint="employee photo"
            />
            {funcionario.is_lider && (
              <div 
                className="absolute top-2 right-2 text-white p-1 rounded-full shadow-md z-10"
                style={{ backgroundColor: 'var(--leadership, #f59e0b)' }}
              >
                <Crown size={12} fill="white" />
              </div>
            )}
          </div>

          {/* Informações do Colaborador */}
          <div className="space-y-1 w-full">
            <h3 className="font-bold text-lg text-primary leading-tight">
              {funcionario.nome}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {funcionario.cargo}
            </p>
          </div>

          {/* Badge do Setor no Rodapé (Igual ao modelo) */}
          <div className="pt-2">
            <Badge 
              variant="secondary" 
              className="text-[9px] font-bold uppercase tracking-widest px-3 h-5 bg-blue-50 text-blue-600 border-none rounded-full"
            >
              {funcionario.subcategoria && funcionario.subcategoria !== "Geral" 
                ? funcionario.subcategoria 
                : (setor?.nome || "Setor")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                {funcionario.nome}
                {funcionario.is_lider && <Crown size={18} fill="white" />}
              </DialogTitle>
              {funcionario.is_lider && (
                <span className="text-white/80 font-bold uppercase text-[10px] mt-1">
                  {funcionario.titulo_lider || "Líder"}
                </span>
              )}
            </DialogHeader>
          </div>
          
          <div className="p-6 grid gap-4">
            <div className="flex justify-center">
              <div className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-lg border-4 border-white -mt-16 bg-slate-100">
                <Image
                  src={funcionario.foto_url || "https://picsum.photos/seed/placeholder/400/533"}
                  alt={funcionario.nome}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                    {funcionario.cargo}
                  </Badge>
                  {funcionario.subcategoria && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {funcionario.subcategoria}
                    </Badge>
                  )}
                </div>
              </div>

              {funcionario.email && (
                <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                  <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                    <Mail size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">E-mail</span>
                    <a href={`mailto:${funcionario.email}`} className="text-xs font-semibold hover:text-primary transition-colors">
                      {funcionario.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {funcionario.ramal && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                      <Hash size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Ramal</span>
                      <span className="text-xs font-bold">{funcionario.ramal}</span>
                    </div>
                  </div>
                )}
                {funcionario.unidade && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                      <Building size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Unidade</span>
                      <span className="text-xs font-bold">{funcionario.unidade}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t text-center">
              <p className="text-[9px] text-muted-foreground uppercase font-medium">
                Cadastrado em {funcionario.data_criacao ? new Date(funcionario.data_criacao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
