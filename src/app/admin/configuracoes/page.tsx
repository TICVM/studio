
"use client"

import { useState, useEffect, useRef } from "react";
import { Settings, Save, Palette, Image as ImageIcon, Type, Loader2, Users, Upload, X, Maximize, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
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
    primaryColor: "#3b82f6",
    backgroundColor: "#f8fafc",
    foregroundColor: "#020617",
    accentColor: "#f1f5f9",
    sidebarBackgroundColor: "#0f172a",
    sidebarForegroundColor: "#f8fafc",
    logoStyle: "square_with_name",
    logoHeight: 48
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        logoStyle: settings.logoStyle || "square_with_name",
        logoHeight: settings.logoHeight || 48,
        backgroundColor: settings.backgroundColor || "#f8fafc",
        foregroundColor: settings.foregroundColor || "#020617",
        accentColor: settings.accentColor || "#f1f5f9",
        sidebarBackgroundColor: settings.sidebarBackgroundColor || "#0f172a",
        sidebarForegroundColor: settings.sidebarForegroundColor || "#f8fafc",
      });
    }
  }, [settings]);

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        const optimizedLogo = await compressImage(base64, 800, 400);
        setForm(prev => ({ ...prev, logoUrl: optimizedLogo }));
        toast({
          title: "Logo processada",
          description: "A imagem foi otimizada para o sistema.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erro no processamento",
          description: "Não foi possível otimizar a imagem.",
        });
      } finally {
        setIsProcessing(false);
      }
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
      description: "As alterações visuais foram aplicadas.",
    });
  };

  const ColorPicker = ({ label, id, value, onChange, description }: { label: string, id: string, value: string | undefined, onChange: (v: string) => void, description: string }) => (
    <div className="flex items-center gap-4">
      <Input 
        type="color" 
        id={id} 
        value={value || "#000000"} 
        onChange={e => onChange(e.target.value)}
        className="w-12 h-12 p-1 cursor-pointer border-2"
      />
      <div className="flex-1">
        <Label htmlFor={id} className="font-bold">{label}</Label>
        <p className="text-[10px] text-muted-foreground uppercase">{description}</p>
        <p className="text-xs font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Identidade Visual</h1>
          <p className="text-muted-foreground">Personalize as cores e a marca do sistema para refletir sua empresa.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identidade e Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layout className="h-5 w-5" />
                Marca e Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="systemName">Nome da Organização</Label>
                <Input 
                  id="systemName" 
                  value={form.systemName} 
                  onChange={e => setForm({...form, systemName: e.target.value})} 
                  placeholder="Ex: Empresa X"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Estilo do Logo</Label>
                  <RadioGroup 
                    value={form.logoStyle} 
                    onValueChange={(val: 'square_with_name' | 'rectangular_no_name') => setForm({...form, logoStyle: val})}
                    className="grid gap-4"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="square_with_name" id="style1" />
                      <Label htmlFor="style1" className="cursor-pointer">
                        <div className="font-bold">Ícone + Nome</div>
                        <div className="text-[10px] text-muted-foreground">Logotipo quadrado + texto ao lado.</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="rectangular_no_name" id="style2" />
                      <Label htmlFor="style2" className="cursor-pointer">
                        <div className="font-bold">Logo Retangular</div>
                        <div className="text-[10px] text-muted-foreground">Apenas a imagem (ideal se o nome já estiver nela).</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Maximize size={14} className="text-primary" />
                      Altura do Logo
                    </Label>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">{form.logoHeight}px</span>
                  </div>
                  <Slider 
                    value={[form.logoHeight || 48]} 
                    min={24} 
                    max={80} 
                    step={2} 
                    onValueChange={(vals) => setForm({...form, logoHeight: vals[0]})} 
                  />
                  
                  <div className="pt-2">
                    <Label>Upload do Logo</Label>
                    <div className="mt-2">
                      {form.logoUrl ? (
                        <div className="relative border rounded-lg bg-slate-50 flex items-center justify-center p-2 h-32 overflow-hidden">
                          <img src={form.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          <button 
                            type="button"
                            onClick={removeLogo}
                            className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 text-muted-foreground"
                        >
                          {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload size={24} />}
                          <span className="text-xs font-bold uppercase">{isProcessing ? "Processando..." : "Selecionar Logo"}</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cores do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Cores e Temas
              </CardTitle>
              <CardDescription>Defina a paleta de cores global do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Interface Principal</h3>
                <ColorPicker 
                  label="Cor Primária" 
                  id="primaryColor" 
                  value={form.primaryColor} 
                  onChange={v => setForm({...form, primaryColor: v})}
                  description="Botões, ícones de liderança e destaques."
                />
                <ColorPicker 
                  label="Cor de Fundo" 
                  id="backgroundColor" 
                  value={form.backgroundColor} 
                  onChange={v => setForm({...form, backgroundColor: v})}
                  description="A cor de fundo das páginas."
                />
                <ColorPicker 
                  label="Cor do Texto" 
                  id="foregroundColor" 
                  value={form.foregroundColor} 
                  onChange={v => setForm({...form, foregroundColor: v})}
                  description="Cor principal dos textos e títulos."
                />
                <ColorPicker 
                  label="Cor de Destaque" 
                  id="accentColor" 
                  value={form.accentColor} 
                  onChange={v => setForm({...form, accentColor: v})}
                  description="Usada em badges e fundos secundários."
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Painel Administrativo</h3>
                <ColorPicker 
                  label="Fundo da Sidebar" 
                  id="sidebarBackgroundColor" 
                  value={form.sidebarBackgroundColor} 
                  onChange={v => setForm({...form, sidebarBackgroundColor: v})}
                  description="Cor de fundo do menu lateral admin."
                />
                <ColorPicker 
                  label="Texto da Sidebar" 
                  id="sidebarForegroundColor" 
                  value={form.sidebarForegroundColor} 
                  onChange={v => setForm({...form, sidebarForegroundColor: v})}
                  description="Cor dos links e ícones da sidebar."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pré-visualização Lateral */}
        <div className="space-y-6">
          <Card className="sticky top-8 overflow-hidden border-none shadow-xl">
            <CardHeader className="bg-slate-900 text-white p-4">
              <CardTitle className="text-xs uppercase tracking-widest opacity-70">Pré-visualização do Topo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Simulação Navbar */}
              <div 
                className="w-full border-b p-4 flex items-center justify-between"
                style={{ backgroundColor: form.backgroundColor, color: form.foregroundColor }}
              >
                <div className="flex items-center gap-3">
                  {form.logoStyle === 'square_with_name' ? (
                    <>
                      <div 
                        className="rounded-lg flex items-center justify-center text-white overflow-hidden p-1 shadow-sm shrink-0"
                        style={{ backgroundColor: form.primaryColor, width: (form.logoHeight || 32) * 0.8, height: (form.logoHeight || 32) * 0.8 }}
                      >
                        {form.logoUrl ? (
                          <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Users size={16} />
                        )}
                      </div>
                      <span className="font-black tracking-tighter" style={{ color: form.primaryColor, fontSize: (form.logoHeight || 32) * 0.4 }}>
                        {form.systemName || "Nome"}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center justify-start overflow-hidden" style={{ height: (form.logoHeight || 32) * 0.8 }}>
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo" className="h-full w-auto object-contain" />
                      ) : (
                        <span className="font-black tracking-tighter" style={{ color: form.primaryColor, fontSize: (form.logoHeight || 32) * 0.4 }}>{form.systemName}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-8 w-20 rounded-md opacity-50" style={{ backgroundColor: form.primaryColor }} />
              </div>

              {/* Simulação Card */}
              <div className="p-8 space-y-6" style={{ backgroundColor: form.backgroundColor }}>
                <div className="bg-white rounded-xl shadow-md p-4 border space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-8 rounded bg-slate-100 border relative overflow-hidden">
                      <Users size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-24 rounded" style={{ backgroundColor: form.primaryColor }} />
                      <div className="h-2 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-full rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: form.accentColor, color: form.foregroundColor }}>
                    Destaque de Cor
                  </div>
                </div>

                {/* Simulação Sidebar */}
                <div 
                  className="rounded-lg border p-4 flex gap-4 items-center"
                  style={{ backgroundColor: form.sidebarBackgroundColor, color: form.sidebarForegroundColor }}
                >
                  <div className="h-8 w-8 rounded-full opacity-20" style={{ backgroundColor: form.sidebarForegroundColor }} />
                  <div className="space-y-1 flex-1">
                    <div className="h-2 w-full rounded opacity-50" style={{ backgroundColor: form.sidebarForegroundColor }} />
                    <div className="h-2 w-2/3 rounded opacity-30" style={{ backgroundColor: form.sidebarForegroundColor }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button type="submit" className="w-full h-14 shadow-lg text-lg font-bold" disabled={isProcessing}>
            <Save className="mr-2 h-6 w-6" />
            Salvar Tudo
          </Button>
        </div>
      </form>
    </div>
  );
}
