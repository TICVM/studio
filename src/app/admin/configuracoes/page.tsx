
"use client"

import { useState, useEffect, useRef } from "react";
import { Settings, Save, Palette, Image as ImageIcon, Type, Loader2, Users, Upload, X, Maximize, Layout, Crown, MoveHorizontal, MousePointer2, AlignCenter, AlignLeft, Square, Columns, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
    leadershipColor: "#f59e0b",
    backgroundColor: "#f8fafc",
    foregroundColor: "#020617",
    accentColor: "#f1f5f9",
    sidebarBackgroundColor: "#0f172a",
    sidebarForegroundColor: "#f8fafc",
    logoStyle: "square_with_name",
    logoHeight: 48,
    cardPadding: 24,
    cardBorderRadius: 12,
    cardShowShadow: true,
    cardTextAlign: "center",
    cardPhotoSize: 75,
    cardPhotoAspectRatio: "3/4",
    cardShowBadge: true,
    cardBadgePosition: "bottom",
    headerStyle: "line_right",
    headerFontSize: 24,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        logoStyle: settings.logoStyle || "square_with_name",
        logoHeight: settings.logoHeight || 48,
        leadershipColor: settings.leadershipColor || "#f59e0b",
        backgroundColor: settings.backgroundColor || "#f8fafc",
        foregroundColor: settings.foregroundColor || "#020617",
        accentColor: settings.accentColor || "#f1f5f9",
        sidebarBackgroundColor: settings.sidebarBackgroundColor || "#0f172a",
        sidebarForegroundColor: settings.sidebarForegroundColor || "#f8fafc",
        cardPadding: settings.cardPadding ?? 24,
        cardBorderRadius: settings.cardBorderRadius ?? 12,
        cardShowShadow: settings.cardShowShadow ?? true,
        cardTextAlign: settings.cardTextAlign || "center",
        cardPhotoSize: settings.cardPhotoSize ?? 75,
        cardPhotoAspectRatio: settings.cardPhotoAspectRatio || "3/4",
        cardShowBadge: settings.cardShowBadge ?? true,
        cardBadgePosition: settings.cardBadgePosition || "bottom",
        headerStyle: settings.headerStyle || "line_right",
        headerFontSize: settings.headerFontSize ?? 24,
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
        toast({ title: "Logo processada", description: "A imagem foi otimizada para o sistema." });
      } catch (err) {
        toast({ variant: "destructive", title: "Erro no processamento", description: "Não foi possível otimizar a imagem." });
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      updateDocumentNonBlocking(settingsRef, form);
      toast({ 
        title: "Configurações salvas!", 
        description: "As alterações visuais foram publicadas com sucesso." 
      });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const ColorPicker = ({ label, id, value, onChange, description }: { label: string, id: string, value: string | undefined, onChange: (v: string) => void, description: string }) => (
    <div className="flex items-center gap-4">
      <Input type="color" id={id} value={value || "#000000"} onChange={e => onChange(e.target.value)} className="w-12 h-12 p-1 cursor-pointer border-2" />
      <div className="flex-1">
        <Label htmlFor={id} className="font-bold">{label}</Label>
        <p className="text-[10px] text-muted-foreground uppercase">{description}</p>
        <p className="text-xs font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );

  const SaveButton = () => (
    <Button 
      type="button" 
      onClick={() => handleSave()} 
      className="w-full h-12 font-bold uppercase tracking-widest mt-6"
      disabled={isSaving || isProcessing}
    >
      {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
      Salvar Alterações
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Estúdio Visual</h1>
          <p className="text-muted-foreground">Personalize cada detalhe da experiência do seu Carômetro.</p>
        </div>
        <Button 
          onClick={() => handleSave()} 
          className="h-12 px-8 font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700"
          disabled={isSaving || isProcessing}
        >
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
          Publicar Agora
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        <div className="xl:col-span-3">
          <Tabs defaultValue="marca" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-slate-100 p-1">
              <TabsTrigger value="marca">Marca e Logo</TabsTrigger>
              <TabsTrigger value="cores">Cores</TabsTrigger>
              <TabsTrigger value="layout">Layout dos Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="marca" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Identidade da Organização</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">Nome da Empresa</Label>
                    <Input id="systemName" value={form.systemName} onChange={e => setForm({...form, systemName: e.target.value})} placeholder="Ex: Corporativo Ltda" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Estilo de Exibição do Logo</Label>
                      <RadioGroup value={form.logoStyle} onValueChange={(val: any) => setForm({...form, logoStyle: val})} className="grid gap-3">
                        <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="square_with_name" id="s1" />
                          <Label htmlFor="s1" className="cursor-pointer">Ícone Quadrado + Texto</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="rectangular_no_name" id="s2" />
                          <Label htmlFor="s2" className="cursor-pointer">Logo Amplo (Sem texto ao lado)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label>Altura do Logo</Label><span className="text-xs font-bold text-primary">{form.logoHeight}px</span></div>
                        <Slider value={[form.logoHeight || 48]} min={24} max={100} step={2} onValueChange={(v) => setForm({...form, logoHeight: v[0]})} />
                      </div>
                      <div className="space-y-3">
                        <Label>Logo do Sistema</Label>
                        {form.logoUrl ? (
                          <div className="relative border rounded-xl p-4 bg-slate-50 flex items-center justify-center h-32 overflow-hidden shadow-inner">
                            <img src={form.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={removeLogo}><X size={14} /></Button>
                          </div>
                        ) : (
                          <div onClick={() => fileInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 text-muted-foreground transition-colors">
                            {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload size={24} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{isProcessing ? "Processando..." : "Carregar Imagem"}</span>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>
                  <SaveButton />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cores" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Paleta de Cores</CardTitle></CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Sistema e Carômetro</h3>
                      <ColorPicker label="Cor Primária" id="pc" value={form.primaryColor} onChange={v => setForm({...form, primaryColor: v})} description="Botões e destaques principais." />
                      <ColorPicker label="Destaque Liderança" id="lc" value={form.leadershipColor} onChange={v => setForm({...form, leadershipColor: v})} description="Coroas e cargos de coordenação." />
                      <ColorPicker label="Cor de Fundo" id="bc" value={form.backgroundColor} onChange={v => setForm({...form, backgroundColor: v})} description="Fundo principal das páginas." />
                      <ColorPicker label="Cor do Texto" id="fc" value={form.foregroundColor} onChange={v => setForm({...form, foregroundColor: v})} description="Títulos e parágrafos." />
                      <ColorPicker label="Destaque Suave" id="ac" value={form.accentColor} onChange={v => setForm({...form, accentColor: v})} description="Badges e fundos secundários." />
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Menu Administrativo</h3>
                      <ColorPicker label="Fundo Lateral" id="sbc" value={form.sidebarBackgroundColor} onChange={v => setForm({...form, sidebarBackgroundColor: v})} description="Cor do menu lateral admin." />
                      <ColorPicker label="Texto Lateral" id="sfc" value={form.sidebarForegroundColor} onChange={v => setForm({...form, sidebarForegroundColor: v})} description="Links e ícones da sidebar." />
                    </div>
                  </div>
                  <SaveButton />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Arquitetura Visual dos Cards</CardTitle></CardHeader>
                <CardContent className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ajustes do Card</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Maximize size={14} /> Espaçamento Interno (Padding)</Label><span className="text-xs font-bold">{form.cardPadding}px</span></div>
                        <Slider value={[form.cardPadding || 24]} min={8} max={48} step={4} onValueChange={(v) => setForm({...form, cardPadding: v[0]})} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Square size={14} /> Arredondamento (Border Radius)</Label><span className="text-xs font-bold">{form.cardBorderRadius}px</span></div>
                        <Slider value={[form.cardBorderRadius || 12]} min={0} max={32} step={4} onValueChange={(v) => setForm({...form, cardBorderRadius: v[0]})} />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label className="flex items-center gap-2 cursor-pointer" htmlFor="shadow"><MoveHorizontal size={14} /> Exibir Sombra Suave</Label>
                        <Switch id="shadow" checked={form.cardShowShadow} onCheckedChange={(v) => setForm({...form, cardShowShadow: v})} />
                      </div>
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2"><MousePointer2 size={14} /> Alinhamento do Texto</Label>
                        <RadioGroup value={form.cardTextAlign} onValueChange={(v: any) => setForm({...form, cardTextAlign: v})} className="flex gap-4">
                          <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="center" id="ta1" /><Label htmlFor="ta1" className="flex items-center gap-1 cursor-pointer text-xs"><AlignCenter size={14} /> Centro</Label></div>
                          <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="left" id="ta2" /><Label htmlFor="ta2" className="flex items-center gap-1 cursor-pointer text-xs"><AlignLeft size={14} /> Esquerda</Label></div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ajustes da Foto e Badge</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label>Tamanho Proporcional da Foto</Label><span className="text-xs font-bold">{form.cardPhotoSize}%</span></div>
                        <Slider value={[form.cardPhotoSize || 75]} min={50} max={100} step={5} onValueChange={(v) => setForm({...form, cardPhotoSize: v[0]})} />
                      </div>
                      <div className="space-y-3">
                        <Label>Proporção da Foto</Label>
                        <RadioGroup value={form.cardPhotoAspectRatio} onValueChange={(v: any) => setForm({...form, cardPhotoAspectRatio: v})} className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="3/4" id="ar1" /><Label htmlFor="ar1" className="cursor-pointer text-xs">3x4 (Vertical)</Label></div>
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="1/1" id="ar2" /><Label htmlFor="ar2" className="cursor-pointer text-xs">1x1 (Quadrado)</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                        <Label className="flex items-center gap-2 cursor-pointer" htmlFor="badge">Exibir Selo do Setor</Label>
                        <Switch id="badge" checked={form.cardShowBadge} onCheckedChange={(v) => setForm({...form, cardShowBadge: v})} />
                      </div>
                      {form.cardShowBadge && (
                        <div className="space-y-3 pl-4 border-l-2">
                          <Label>Posição do Selo</Label>
                          <RadioGroup value={form.cardBadgePosition} onValueChange={(v: any) => setForm({...form, cardBadgePosition: v})} className="flex gap-4">
                            <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="top" id="bp1" /><Label htmlFor="bp1" className="cursor-pointer text-[10px] uppercase font-bold">Topo</Label></div>
                            <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="bottom" id="bp2" /><Label htmlFor="bp2" className="cursor-pointer text-[10px] uppercase font-bold">Rodapé</Label></div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Layout de Cabeçalho dos Setores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label>Estilo do Título</Label>
                        <RadioGroup value={form.headerStyle} onValueChange={(v: any) => setForm({...form, headerStyle: v})} className="grid gap-2">
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="line_right" id="hs1" /><Label htmlFor="hs1" className="cursor-pointer text-xs">Linha à Direita</Label></div>
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="full_underline" id="hs2" /><Label htmlFor="hs2" className="cursor-pointer text-xs">Sublinhado Completo</Label></div>
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="box_background" id="hs3" /><Label htmlFor="hs3" className="cursor-pointer text-xs">Fundo Colorido</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="col-span-2 space-y-4">
                        <div className="flex justify-between items-center"><Label>Tamanho da Fonte do Setor</Label><span className="text-xs font-bold">{form.headerFontSize}px</span></div>
                        <Slider value={[form.headerFontSize || 24]} min={16} max={48} step={2} onValueChange={(v) => setForm({...form, headerFontSize: v[0]})} />
                        <div className="mt-4 p-4 border rounded-xl bg-slate-50 flex items-center justify-center min-h-[100px]">
                          <div className="w-full">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-4">Prévia do Cabeçalho:</p>
                            <div className={cn(
                              "flex items-center gap-4 transition-all",
                              form.headerStyle === 'box_background' && "bg-primary text-white p-3 rounded-lg",
                              form.headerStyle === 'full_underline' && "border-b-2 border-primary pb-2"
                            )}>
                              <h2 className="font-bold tracking-tight" style={{ 
                                fontSize: form.headerFontSize, 
                                color: form.headerStyle === 'box_background' ? 'white' : form.primaryColor 
                              }}>DEPARTAMENTO</h2>
                              {form.headerStyle === 'line_right' && <div className="h-px flex-1 bg-slate-200" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <SaveButton />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pré-visualização Lateral Compacta */}
        <div className="space-y-6">
          <Card className="sticky top-8 overflow-hidden border-none shadow-2xl max-w-[320px] mx-auto">
            <CardHeader className="bg-slate-900 text-white p-4">
              <CardTitle className="text-[10px] uppercase tracking-widest opacity-70">Painel de Visualização</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-6 scale-[0.9] origin-top" style={{ backgroundColor: form.backgroundColor }}>
                {/* Navbar Preview */}
                <div className="flex items-center gap-2">
                  {form.logoStyle === 'square_with_name' ? (
                    <>
                      <div className="rounded-lg flex items-center justify-center text-white overflow-hidden p-1 shadow-sm shrink-0"
                        style={{ backgroundColor: form.primaryColor, width: (form.logoHeight || 32) * 0.8, height: (form.logoHeight || 32) * 0.8 }}>
                        {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Users size={16} />}
                      </div>
                      <span className="font-black tracking-tighter truncate" style={{ color: form.primaryColor, fontSize: (form.logoHeight || 32) * 0.4 }}>{form.systemName || "Nome"}</span>
                    </>
                  ) : (
                    <div className="flex items-center justify-start overflow-hidden" style={{ height: (form.logoHeight || 32) * 0.8 }}>
                      {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="h-full w-auto object-contain" /> : <span className="font-black tracking-tighter" style={{ color: form.primaryColor }}>{form.systemName}</span>}
                    </div>
                  )}
                </div>

                {/* Card Preview */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-full bg-white transition-all border border-slate-100",
                    form.cardShowShadow && "shadow-lg"
                  )} style={{ 
                    padding: (form.cardPadding || 24) * 0.7, 
                    borderRadius: form.cardBorderRadius,
                    textAlign: form.cardTextAlign as any
                  }}>
                    {form.cardShowBadge && form.cardBadgePosition === 'top' && (
                      <div className="mb-3"><span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest" style={{ backgroundColor: form.accentColor, color: form.primaryColor }}>Departamento</span></div>
                    )}
                    
                    <div className="flex justify-center mb-3">
                      <div className="bg-slate-100 rounded-md overflow-hidden relative shadow-inner" style={{ 
                        width: `${form.cardPhotoSize}%`, 
                        aspectRatio: form.cardPhotoAspectRatio === '3/4' ? '3/4' : '1/1'
                      }}>
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Users size={24} /></div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-black text-sm leading-tight" style={{ color: form.primaryColor }}>João Silva</h3>
                      <p className="text-[10px] font-medium text-slate-500">Diretor Executivo</p>
                    </div>

                    {form.cardShowBadge && form.cardBadgePosition === 'bottom' && (
                      <div className="mt-3 pt-1"><span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest" style={{ backgroundColor: form.accentColor, color: form.primaryColor }}>Setor</span></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Resumo do Estilo</p>
            <div className="mt-2 flex justify-center gap-2">
              <div className="h-4 w-4 rounded-full border shadow-sm" style={{ backgroundColor: form.primaryColor }} title="Primária" />
              <div className="h-4 w-4 rounded-full border shadow-sm" style={{ backgroundColor: form.leadershipColor }} title="Liderança" />
              <div className="h-4 w-4 rounded-full border shadow-sm" style={{ backgroundColor: form.backgroundColor }} title="Fundo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

