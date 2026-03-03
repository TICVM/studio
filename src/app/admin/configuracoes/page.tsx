
"use client"

import { useState, useEffect, useRef } from "react";
import { Settings, Save, Palette, Image as ImageIcon, Type, Loader2, Users, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // Limite de 500KB para não sobrecarregar o documento do Firestore
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O logotipo deve ter no máximo 500KB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm(prev => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm(prev => ({ ...prev, logoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateDocumentNonBlocking(settingsRef, form);
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
                <Label>Logotipo da Empresa</Label>
                <div className="flex flex-col gap-4">
                  {form.logoUrl ? (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-2">
                      <img src={form.logoUrl} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                      <button 
                        type="button"
                        onClick={removeLogo}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full shadow-sm hover:bg-destructive/90"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors text-muted-foreground"
                    >
                      <Upload size={24} />
                      <span className="text-[10px] font-bold uppercase">Upload</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Recomendado: Imagem PNG ou SVG com fundo transparente (máx. 500KB).</p>
                </div>
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white overflow-hidden p-1"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
