
"use client"

import Image from "next/image";
import { Funcionario, Setor, SystemSettings } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Mail, Hash, Building, Users, Cake } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface EmployeeCardProps {
  funcionario: Funcionario;
  setor?: Setor;
}

export function EmployeeCard({ funcionario, setor }: EmployeeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  // Fallbacks de Layout
  const textAlign = settings?.cardTextAlign || 'center';
  const padding = settings?.cardPadding ?? 24;
  const borderRadius = settings?.cardBorderRadius ?? 12;
  const showShadow = settings?.cardShowShadow ?? true;
  const photoSize = settings?.cardPhotoSize ?? 75;
  const aspectRatio = settings?.cardPhotoAspectRatio || '3/4';
  const showBadge = settings?.cardShowBadge ?? true;
  const badgePos = settings?.cardBadgePosition || 'bottom';
  const showBirthdayIcon = settings?.showBirthdayIcon ?? true;

  // Verificar se o aniversário é hoje de forma robusta
  const isBirthdayToday = useMemo(() => {
    if (!funcionario.data_nascimento) return false;
    
    // Pegar data local do navegador
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // Parsear data de nascimento (YYYY-MM-DD)
    const parts = funcionario.data_nascimento.split('-');
    if (parts.length !== 3) return false;

    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);

    return currentMonth === birthMonth && currentDay === birthDay;
  }, [funcionario.data_nascimento]);

  const badgeContent = (
    <div className={cn("pt-2", badgePos === 'top' && "pt-0 mb-4")}>
      <Badge 
        variant="secondary" 
        className="text-[9px] font-black uppercase tracking-widest px-3 h-5 border-none rounded-full"
        style={{ 
          backgroundColor: 'hsl(var(--accent))', 
          color: 'hsl(var(--accent-foreground))' 
        }}
      >
        {funcionario.subcategoria && funcionario.subcategoria !== "Geral" 
          ? funcionario.subcategoria 
          : (setor?.nome || "Setor")}
      </Badge>
    </div>
  );

  return (
    <>
      <div className="group relative h-full w-full max-w-[280px]">
        <Card 
          onClick={() => setIsOpen(true)}
          className={cn(
            "overflow-hidden cursor-pointer transition-all duration-300 h-full flex flex-col border w-full",
            showShadow ? "shadow-sm" : "shadow-none",
            "group-hover:scale-[1.02] group-hover:!border-[var(--hover-color)] group-hover:!shadow-[0_10px_30px_-5px_var(--hover-color)]"
          )}
          style={{ 
            padding: `${padding}px`,
            borderRadius: `${borderRadius}px`,
            textAlign: textAlign as any,
            backgroundColor: 'hsl(var(--card))',
            borderColor: showShadow ? 'transparent' : 'hsl(var(--border))',
          }}
        >
          <CardContent className="p-0 flex flex-col items-center text-inherit flex-1 w-full">
            {showBadge && badgePos === 'top' && badgeContent}

            {/* Container da Foto */}
            <div className={cn(
              "relative mb-4 rounded-md overflow-hidden bg-slate-100 border border-slate-200",
              aspectRatio === '3/4' ? "aspect-[3/4]" : "aspect-square"
            )} style={{ width: `${photoSize}%` }}>
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
              {isBirthdayToday && showBirthdayIcon && (
                <div 
                  className="absolute bottom-2 left-2 bg-pink-500 text-white p-1.5 rounded-full shadow-lg z-20 animate-bounce"
                >
                  <Cake size={14} fill="white" />
                </div>
              )}
            </div>

            {/* Informações do Colaborador */}
            <div className="space-y-1 w-full flex-1">
              <h3 className="font-bold text-lg leading-tight flex items-center justify-center gap-1.5" style={{ color: 'hsl(var(--name-color, var(--primary)))' }}>
                {funcionario.nome}
                {isBirthdayToday && showBirthdayIcon && <span className="text-pink-500 text-xs">🎂</span>}
              </h3>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--job-color, var(--foreground)))' }}>
                {funcionario.cargo}
              </p>
            </div>

            {showBadge && badgePos === 'bottom' && badgeContent}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn(
            "p-6 text-white transition-colors",
            isBirthdayToday ? "bg-gradient-to-r from-pink-500 to-purple-600" : "bg-primary"
          )} style={{ backgroundColor: isBirthdayToday ? undefined : 'hsl(var(--primary))' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                {funcionario.nome}
                {funcionario.is_lider && <Crown size={18} fill="white" />}
                {isBirthdayToday && <Cake size={18} className="animate-bounce" />}
              </DialogTitle>
              <div className="flex flex-col gap-1 mt-1">
                {funcionario.is_lider && (
                  <span className="text-white/80 font-bold uppercase text-[10px]">
                    {funcionario.titulo_lider || "Líder"}
                  </span>
                )}
                {isBirthdayToday && (
                  <span className="text-white font-black uppercase text-[10px] bg-white/20 px-2 py-0.5 rounded-full self-start">
                    Aniversariante do Dia! 🥳
                  </span>
                )}
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6 grid gap-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <div className="flex justify-center">
              <div className={cn(
                "relative w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-lg border-4 -mt-16 bg-slate-100",
                isBirthdayToday ? "border-pink-200" : "border-white"
              )}>
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
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    {funcionario.cargo}
                  </Badge>
                  {funcionario.subcategoria && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase" style={{ color: 'hsl(var(--foreground))' }}>
                      {funcionario.subcategoria}
                    </Badge>
                  )}
                </div>
              </div>

              {funcionario.email && (
                <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                  <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary" style={{ color: 'hsl(var(--primary))' }}>
                    <Mail size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">E-mail</span>
                    <a href={`mailto:${funcionario.email}`} className="text-xs font-semibold hover:opacity-70 transition-colors" style={{ color: 'hsl(var(--foreground))' }}>
                      {funcionario.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {funcionario.ramal && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary" style={{ color: 'hsl(var(--primary))' }}>
                      <Hash size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Ramal</span>
                      <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>{funcionario.ramal}</span>
                    </div>
                  </div>
                )}
                {funcionario.unidade && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border shadow-sm text-primary" style={{ color: 'hsl(var(--primary))' }}>
                      <Building size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Unidade</span>
                      <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>{funcionario.unidade}</span>
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
