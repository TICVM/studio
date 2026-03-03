
"use client"

import { useState, useEffect } from "react";
import { Settings, Save, Palette, Image, Type, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings, isLoading } = useDoc<SystemSettings>(settingsRef);

  const [form, setForm] = useState<Partial<SystemSettings>>({
    systemName: "",
    logoUrl: "",
    primaryColor: "#3b82f6"
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocumentNonBlocking(settingsRef, form, { merge: true });
    toast({
      title: "Configurações salvas",
      description: "As alterações foram aplicadas ao sistema.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Personalize a identidade visual do seu Carômetro.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-5 w-5 text-primary" />
                Identidade
              </CardTitle>
              <CardDescription>Nome e Marca da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">Nome do Sistema</Label>
                <Input 
                  id="systemName" 
                  value={form.systemName} 
                  onChange={e => setForm({...form, systemName: e.target.value})} 
                  placeholder="Ex: Carômetro Empresa X"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL do Logotipo</Label>
                <Input 
                  id="logoUrl" 
                  value={form.logoUrl} 
                  onChange={e => setForm({...form, logoUrl: e.target.value})} 
                  placeholder="https://suaempresa.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Cores e Estilo
              </CardTitle>
              <CardDescription>Defina a cor principal da interface.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input 
                    type="color" 
                    id="primaryColor" 
                    value={form.primaryColor} 
                    onChange={e => setForm({...form, primaryColor: e.target.value})}
                    className="w-16 h-16 p-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <p className="text-xs text-muted-foreground">Esta cor será aplicada a botões, ícones e destaques.</p>
                    <p className="text-sm font-mono mt-1 font-bold">{form.primaryColor}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 shadow-md">
            <Save className="mr-2 h-5 w-5" />
            Salvar Alterações
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-50">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="p-4 bg-white rounded-lg shadow-sm border space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <Users size={20} />
                    )}
                  </div>
                  <span className="font-bold text-lg" style={{ color: form.primaryColor }}>
                    {form.systemName || "Nome do Sistema"}
                  </span>
                </div>
                <div className="space-y-2">
                  <div 
                    className="h-8 w-full rounded-md" 
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground text-center bg-slate-100 p-4 rounded-lg">
                <p>As alterações de cor afetam todos os botões e elementos de destaque do sistema.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
