
"use client"

import Image from "next/image";
import { Funcionario, Setor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Mail, Hash, Building, ArrowRight } from "lucide-react";
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
        className={`overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 border-none bg-white h-full flex flex-col shadow-md ${funcionario.is_lider ? 'ring-2 ring-primary/20' : ''}`}
      >
        <CardContent className="p-5 flex flex-col items-center text-center flex-1">
          {/* Container da Foto */}
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-slate-100 group-hover:border-primary/30 transition-all duration-300 shadow-sm bg-slate-50 mb-5">
            <Image
              src={funcionario.foto_url || "https://picsum.photos/seed/placeholder/400/533"}
              alt={funcionario.nome}
              fill
              className="object-cover"
              data-ai-hint="employee photo"
            />
            {funcionario.is_lider && (
              <div 
                className="absolute top-2 right-2 text-white p-1.5 rounded-full shadow-lg z-10"
                style={{ backgroundColor: 'var(--leadership, #f59e0b)' }}
              >
                <Crown size={14} fill="white" />
              </div>
            )}
          </div>

          {/* Informações do Colaborador */}
          <div className="flex-1 flex flex-col items-center justify-between w-full gap-2">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-primary leading-tight px-2">
                {funcionario.nome}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {funcionario.cargo}
              </p>
            </div>

            {funcionario.subcategoria && (
              <Badge variant="secondary" className="mt-2 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border-none py-1">
                {funcionario.subcategoria}
              </Badge>
            )}
          </div>

          {/* Rodapé do Cartão */}
          <div className="mt-6 pt-4 border-t w-full flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-primary transition-colors">
            Ver Detalhes <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {funcionario.nome}
                {funcionario.is_lider && <Crown size={20} fill="white" />}
              </DialogTitle>
              {funcionario.is_lider && (
                <span className="text-primary-foreground/90 font-bold uppercase text-xs mt-1">
                  {funcionario.titulo_lider || "Líder"}
                </span>
              )}
            </DialogHeader>
          </div>
          
          <div className="p-6 grid gap-6">
            <div className="flex justify-center">
              <div className="relative w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-xl border-4 border-white -mt-16 bg-slate-100">
                <Image
                  src={funcionario.foto_url || "https://picsum.photos/seed/placeholder/400/533"}
                  alt={funcionario.nome}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="flex gap-2">
                  {funcionario.subcategoria && (
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase py-1">
                      {funcionario.subcategoria}
                    </Badge>
                  )}
                  <Badge className="text-[10px] font-bold uppercase py-1">
                    {funcionario.cargo}
                  </Badge>
                </div>
              </div>

              {funcionario.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">E-mail</span>
                    <a href={`mailto:${funcionario.email}`} className="text-sm font-semibold hover:text-primary transition-colors">
                      {funcionario.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {funcionario.ramal && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                      <Hash size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ramal</span>
                      <span className="text-sm font-bold">{funcionario.ramal}</span>
                    </div>
                  </div>
                )}
                {funcionario.unidade && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary">
                      <Building size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unidade</span>
                      <span className="text-sm font-bold">{funcionario.unidade}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Cadastrado em {funcionario.data_criacao ? new Date(funcionario.data_criacao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
