
import Image from "next/image";
import { Funcionario, Setor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface EmployeeCardProps {
  funcionario: Funcionario;
  setor?: Setor;
}

export function EmployeeCard({ funcionario, setor }: EmployeeCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-muted group-hover:border-primary transition-colors duration-300">
          <Image
            src={funcionario.foto_url}
            alt={funcionario.nome}
            fill
            className="object-cover"
            data-ai-hint="employee photo"
          />
        </div>
        <div className="space-y-1">
          <h3 className="font-headline text-lg font-bold text-primary leading-tight">
            {funcionario.nome}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            {funcionario.cargo}
          </p>
          {setor && (
            <span className="inline-block px-2 py-0.5 mt-2 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider text-primary">
              {setor.nome}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
