
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
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { useState } from "react";

interface EmployeeCardProps {
  funcionario: Funcionario;
  setor?: Setor;
}

export function EmployeeCard({ funcionario, setor }: EmployeeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);
  const { data: allSectors } = useCollection<Setor>(sectorsRef);

  const employeeSectors = allSectors?.filter(s => funcionario.setor_ids?.includes(s.id)) || [];

  return (
    <>
      <Card 
        onClick={() => setIsOpen(true)}
        className={`overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 border-none bg-white ${funcionario.is_lider ? 'ring-2 ring-amber-100' : ''}`}
      >
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative w-36 aspect-[3/4] rounded-lg overflow-hidden border-2 border-muted group-hover:border-primary transition-all duration-300 shadow-sm bg-slate-50">
            <Image
              src={funcionario.foto_url || "https://picsum.photos/seed/placeholder/400/533"}
              alt={funcionario.nome}
              fill
              className="object-cover"
              data-ai-hint="employee photo"
            />
            {funcionario.is_lider && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-lg z-10">
                <Crown size={14} fill="white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-col items-center gap-1">
              {funcionario.is_lider && (
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                  {funcionario.titulo_lider || "Líder de Setor"}
                </span>
              )}
              <h3 className="font-headline text-lg font-bold text-primary leading-tight">
                {funcionario.nome}
              </h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {funcionario.cargo}
            </p>
            {setor && !funcionario.is_lider && (
              <span className="inline-block px-2 py-0.5 mt-2 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider text-primary">
                {setor.nome}
              </span>
            )}
          </div>
          <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
            Ver Detalhes <ArrowRight size={10} />
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
              <div className="flex flex-wrap gap-2 mt-1">
                <p className="text-primary-foreground/80 font-medium">
                  {funcionario.cargo}
                </p>
                {funcionario.is_lider && (
                  <>
                    <span className="text-primary-foreground/40">•</span>
                    <span className="text-primary-foreground/90 font-bold uppercase text-xs">
                      {funcionario.titulo_lider || "Líder"}
                    </span>
                  </>
                )}
              </div>
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
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {employeeSectors.map(s => (
                  <span key={s.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold uppercase border">
                    {s.nome}
                  </span>
                ))}
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
