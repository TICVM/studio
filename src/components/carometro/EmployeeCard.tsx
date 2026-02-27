
import Image from "next/image";
import { Funcionario, Setor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";

interface EmployeeCardProps {
  funcionario: Funcionario;
  setor?: Setor;
}

export function EmployeeCard({ funcionario, setor }: EmployeeCardProps) {
  return (
    <Card className={`overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white ${funcionario.is_lider ? 'ring-2 ring-amber-100' : ''}`}>
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="relative w-36 aspect-[3/4] rounded-lg overflow-hidden border-2 border-muted group-hover:border-primary transition-all duration-300 shadow-sm">
          <Image
            src={funcionario.foto_url}
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
                Líder de Setor
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
      </CardContent>
    </Card>
  );
}
