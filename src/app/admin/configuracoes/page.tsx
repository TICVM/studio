
"use client"

import { useState, useEffect, useRef } from "react";
import { Save, Image as ImageIcon, Palette, Layout, Upload, X, CheckCircle2, Loader2, Users, Square, MousePointer2, AlignCenter, AlignLeft, Maximize, MoveHorizontal, Columns, Crown, LayoutGrid, LayoutList, Tags, Type, Heading } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ColorPickerField = ({ label, id, value, onChange, description }: { label: string, id: string, value: string | undefined, onChange: (v: string) => void, description: string }) => (
  <div className="flex items-center gap-4 group">
    <Input 
      type="color" 
      id={id} 
      value={value || "#000000"} 
      onChange={e => onChange(e.target.value)} 
      className="w-12 h-12 p-1 cursor-pointer border-2 hover:border-primary transition-colors shrink-0" 
    />
    <div className="flex-1 min-w-0">
      <Label htmlFor={id} className="font-bold cursor-pointer block truncate">{label}</Label>
      <p className="text-[10px] text-muted-foreground uppercase truncate">{description}</p>
      <p className="text-xs font-mono mt-0.5">{value}</p>
    </div>
  </div>
);

export default function ConfiguracoesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings, isLoading } = useDoc<SystemSettings>(settingsRef);

  const [form, setForm] = useState<Partial<SystemSettings>>({
    systemName: "",
    heroTitle: "",
    countLabel: "",
    showCount: true,
    logoUrl: "",
    primaryColor: "#3b82f6",
    leadershipColor: "#f59e0b",
    backgroundColor: "#f8fafc",
    cardBackgroundColor: "#ffffff",
    foregroundColor: "#020617",
    accentColor: "#f1f5f9",
    accentForegroundColor: "#ffffff",
    hoverColor: "#3b82f6",
    nameColor: "#3b82f6",
    jobTitleColor: "#64748b",
    sectorHeaderColor: "#1e293b",
    subCategoryColor: "#3b82f6",
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
        showCount: settings.showCount ?? true,
        leadershipColor: settings.leadershipColor || "#f59e0b",
        backgroundColor: settings.backgroundColor || "#f8fafc",
        cardBackgroundColor: settings.cardBackgroundColor || "#ffffff",
        foregroundColor: settings.foregroundColor || "#020617",
        accentColor: settings.accentColor || "#f1f5f9",
        accentForegroundColor: settings.accentForegroundColor || "#ffffff",
        hoverColor: settings.hoverColor || settings.primaryColor || "#3b82f6",
        nameColor: settings.nameColor || settings.primaryColor || "#3b82f6",
        jobTitleColor: settings.jobTitleColor || "#64748b",
        sectorHeaderColor: settings.sectorHeaderColor || settings.primaryColor || "#1e293b",
        subCategoryColor: settings.subCategoryColor || settings.primaryColor || "#3b82f6",
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        setForm(prev => ({ ...prev, logoUrl: base64 }));
        toast({ title: "Logo carregada", description: "O logotipo foi atualizado com sucesso." });
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
        description: "As alterações visuais foram publicadas." 
      });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

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
          <p className="text-muted-foreground">Personalize cada detalhe da experiência visual.</p>
        </div>
        <Button 
          onClick={() => handleSave()} 
          className="h-12 px-8 font-bold shadow-lg"
          disabled={isSaving || isProcessing}
        >
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
          Publicar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        <div className="xl:col-span-3">
          <Tabs defaultValue="marca" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="marca">Identidade</TabsTrigger>
              <TabsTrigger value="cores">Cores e Textos</TabsTrigger>
              <TabsTrigger value="layout">Layout e Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="marca" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Marca da Organização</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="systemName">Nome do Sistema</Label>
                      <Input id="systemName" value={form.systemName} onChange={e => setForm({...form, systemName: e.target.value})} placeholder="Ex: PessoasEmpresa" />
                      <p className="text-[10px] text-muted-foreground">Aparece na barra do navegador e na lateral administrativa.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Título do Cabeçalho</Label>
                      <Input id="heroTitle" value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} placeholder="Ex: Retrato Corporativo" />
                      <p className="text-[10px] text-muted-foreground">O título principal que aparece acima da lista de funcionários.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="countLabel">Rótulo de Contagem</Label>
                      <Input id="countLabel" value={form.countLabel} onChange={e => setForm({...form, countLabel: e.target.value})} placeholder="Ex: colaboradores encontrados" />
                      <p className="text-[10px] text-muted-foreground">O texto que aparece após o número total de colaboradores.</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                      <div className="space-y-0.5">
                        <Label htmlFor="showCount" className="cursor-pointer font-medium">Exibir Número</Label>
                        <p className="text-[10px] text-muted-foreground uppercase">Mostra ou oculta apenas o numeral do total de colaboradores.</p>
                      </div>
                      <Switch 
                        id="showCount" 
                        checked={form.showCount ?? true} 
                        onCheckedChange={(v) => setForm({...form, showCount: v})} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                    <div className="space-y-4">
                      <Label>Estilo do Logo</Label>
                      <RadioGroup value={form.logoStyle} onValueChange={(val: any) => setForm({...form, logoStyle: val})} className="grid gap-3">
                        <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer">
                          <RadioGroupItem value="square_with_name" id="s1" />
                          <Label htmlFor="s1" className="cursor-pointer font-medium">Ícone + Texto</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer">
                          <RadioGroupItem value="rectangular_no_name" id="s2" />
                          <Label htmlFor="s2" className="cursor-pointer font-medium">Logo Amplo</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label>Altura (px)</Label><span className="text-xs font-bold text-primary">{form.logoHeight}px</span></div>
                        <Slider value={[form.logoHeight || 48]} min={24} max={80} step={2} onValueChange={(v) => setForm({...form, logoHeight: v[0]})} />
                      </div>
                      <div className="space-y-3">
                        <Label>Logo</Label>
                        {form.logoUrl ? (
                          <div className="relative border rounded-xl p-4 bg-slate-50 flex items-center justify-center h-32">
                            <img src={form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeLogo}><X size={14} /></Button>
                          </div>
                        ) : (
                          <div onClick={() => fileInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50">
                            {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload size={24} />}
                            <span className="text-[10px] font-bold uppercase">Carregar</span>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cores" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Personalização Cromática</CardTitle></CardHeader>
                <CardContent className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase text-primary border-b pb-2">Ambiente e Interação</h3>
                      <ColorPickerField label="Cor Primária" id="pc" value={form.primaryColor} onChange={v => setForm({...form, primaryColor: v})} description="Botões e destaques principais." />
                      <ColorPickerField label="Cor de Hover (Mouse)" id="hc" value={form.hoverColor} onChange={v => setForm({...form, hoverColor: v})} description="Bordas e sombras ao passar o mouse." />
                      <ColorPickerField label="Fundo da Página" id="bc" value={form.backgroundColor} onChange={v => setForm({...form, backgroundColor: v})} description="Cor base do sistema." />
                      <ColorPickerField label="Fundo dos Cards" id="cbc" value={form.cardBackgroundColor} onChange={v => setForm({...form, cardBackgroundColor: v})} description="Cor interna de cada colaborador." />
                      <ColorPickerField label="Cor de Acento (Badges)" id="ac" value={form.accentColor} onChange={v => setForm({...form, accentColor: v})} description="Fundo dos selos de setor." />
                      <ColorPickerField label="Texto dos Selos" id="afc" value={form.accentForegroundColor} onChange={v => setForm({...form, accentForegroundColor: v})} description="Cor do texto dentro dos selos." />
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase text-primary border-b pb-2">Hierarquia de Textos</h3>
                      <ColorPickerField label="Cor do Nome" id="nc" value={form.nameColor} onChange={v => setForm({...form, nameColor: v})} description="Destaque para o nome do colaborador." />
                      <ColorPickerField label="Cor do Cargo" id="jtc" value={form.jobTitleColor} onChange={v => setForm({...form, jobTitleColor: v})} description="Informação da posição." />
                      <ColorPickerField label="Cor do Título do Setor" id="shc" value={form.sectorHeaderColor} onChange={v => setForm({...form, sectorHeaderColor: v})} description="Títulos de departamento." />
                      <ColorPickerField label="Cor da Subcategoria" id="scc" value={form.subCategoryColor} onChange={v => setForm({...form, subCategoryColor: v})} description="Selo específico de divisão." />
                      <ColorPickerField label="Destaque Liderança" id="lc" value={form.leadershipColor} onChange={v => setForm({...form, leadershipColor: v})} description="Coroa e cargos de gestão." />
                      <ColorPickerField label="Cor Geral / Infos" id="fc" value={form.foregroundColor} onChange={v => setForm({...form, foregroundColor: v})} description="Outras informações básicas." />
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-xs font-black uppercase text-primary border-b pb-2">Administração</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <ColorPickerField label="Fundo da Sidebar" id="sbc" value={form.sidebarBackgroundColor} onChange={v => setForm({...form, sidebarBackgroundColor: v})} description="Fundo lateral admin." />
                      <ColorPickerField label="Texto da Sidebar" id="sfc" value={form.sidebarForegroundColor} onChange={v => setForm({...form, sidebarForegroundColor: v})} description="Links e ícones admin." />
                    </div>
                  </div>
                  <Button type="button" onClick={() => handleSave()} className="w-full mt-6" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" /> Salvar Cores
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Arquitetura Visual</CardTitle></CardHeader>
                <CardContent className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Square size={12} /> Card do Colaborador</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Maximize size={14} /> Espaçamento (Padding)</Label><span className="text-xs font-bold">{form.cardPadding}px</span></div>
                        <Slider value={[form.cardPadding || 24]} min={8} max={48} step={4} onValueChange={(v) => setForm({...form, cardPadding: v[0]})} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Square size={14} /> Cantos (Radius)</Label><span className="text-xs font-bold">{form.cardBorderRadius}px</span></div>
                        <Slider value={[form.cardBorderRadius || 12]} min={0} max={32} step={4} onValueChange={(v) => setForm({...form, cardBorderRadius: v[0]})} />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label className="flex items-center gap-2 cursor-pointer" htmlFor="shadow"><MoveHorizontal size={14} /> Sombra Permanente</Label>
                        <Switch id="shadow" checked={form.cardShowShadow} onCheckedChange={(v) => setForm({...form, cardShowShadow: v})} />
                      </div>
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2"><MousePointer2 size={14} /> Alinhamento do Texto</Label>
                        <RadioGroup value={form.cardTextAlign} onValueChange={(v: any) => setForm({...form, cardTextAlign: v})} className="flex gap-4">
                          <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="center" id="ta1" /><Label htmlFor="ta1" className="cursor-pointer text-xs font-medium">Centro</Label></div>
                          <div className="flex items-center space-x-2 border px-3 py-2 rounded-lg cursor-pointer"><RadioGroupItem value="left" id="ta2" /><Label htmlFor="ta2" className="cursor-pointer text-xs font-medium">Esquerda</Label></div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><ImageIcon size={12} /> Foto e Badges</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label>Tamanho Foto (%)</Label><span className="text-xs font-bold">{form.cardPhotoSize}%</span></div>
                        <Slider value={[form.cardPhotoSize || 75]} min={50} max={100} step={5} onValueChange={(v) => setForm({...form, cardPhotoSize: v[0]})} />
                      </div>
                      <div className="space-y-3">
                        <Label>Proporção</Label>
                        <RadioGroup value={form.cardPhotoAspectRatio} onValueChange={(v: any) => setForm({...form, cardPhotoAspectRatio: v})} className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="3/4" id="ar1" /><Label htmlFor="ar1" className="cursor-pointer text-xs font-medium">3x4 (Vertical)</Label></div>
                          <div className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer"><RadioGroupItem value="1/1" id="ar2" /><Label htmlFor="ar2" className="cursor-pointer text-xs font-medium">1x1 (Quadrado)</Label></div>
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

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Heading size={12} /> Estilo de Cabeçalho</h4>
                      <div className="space-y-4">
                        <Label>Modelo de Título de Setor</Label>
                        <RadioGroup value={form.headerStyle} onValueChange={(v: any) => setForm({...form, headerStyle: v})} className="grid gap-3">
                          <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer">
                            <RadioGroupItem value="line_right" id="hs1" />
                            <Label htmlFor="hs1" className="cursor-pointer font-medium text-sm">Linha à Direita</Label>
                          </div>
                          <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer">
                            <RadioGroupItem value="full_underline" id="hs2" />
                            <Label htmlFor="hs2" className="cursor-pointer font-medium text-sm">Sublinhado Completo</Label>
                          </div>
                          <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer">
                            <RadioGroupItem value="box_background" id="hs3" />
                            <Label htmlFor="hs3" className="cursor-pointer font-medium text-sm">Fundo Colorido</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><Label>Tamanho da Fonte</Label><span className="text-xs font-bold">{form.headerFontSize}px</span></div>
                        <Slider value={[form.headerFontSize || 24]} min={16} max={48} step={2} onValueChange={(v) => setForm({...form, headerFontSize: v[0]})} />
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={() => handleSave()} className="w-full mt-6" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" /> Salvar Layout
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-8 overflow-hidden border-none shadow-2xl max-w-[280px] mx-auto">
            <CardHeader className="bg-slate-900 text-white p-3">
              <CardTitle className="text-[9px] uppercase tracking-widest opacity-70">Amostra Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-6 scale-[0.85] origin-top" style={{ backgroundColor: form.backgroundColor }}>
                {/* Cabeçalho Amostra */}
                <div className={cn(
                  "flex items-center gap-2 mb-4",
                  form.headerStyle === 'box_background' && "p-2 rounded-lg",
                  form.headerStyle === 'full_underline' && "border-b pb-1"
                )} style={{ 
                  backgroundColor: form.headerStyle === 'box_background' ? form.primaryColor : 'transparent',
                  borderBottomColor: form.headerStyle === 'full_underline' ? form.primaryColor : 'transparent'
                }}>
                  <h3 className="font-black truncate" style={{ 
                    fontSize: (form.headerFontSize || 24) * 0.6,
                    color: form.headerStyle === 'box_background' ? 'white' : form.sectorHeaderColor || form.primaryColor
                  }}>Setor Exemplo</h3>
                  {form.headerStyle === 'line_right' && <div className="h-px flex-1 bg-slate-200" />}
                </div>

                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-full transition-all border border-transparent hover:!border-[var(--hover-color)] hover:!shadow-[0_10px_30px_-5px_var(--hover-color)]",
                    form.cardShowShadow && "shadow-lg"
                  )} style={{ 
                    padding: (form.cardPadding || 24) * 0.7, 
                    borderRadius: form.cardBorderRadius,
                    textAlign: form.cardTextAlign as any,
                    backgroundColor: form.cardBackgroundColor || "#ffffff",
                    borderColor: form.cardShowShadow ? 'transparent' : '#e2e8f0',
                    '--hover-color': form.hoverColor || form.primaryColor
                  } as any}>
                    {form.cardShowBadge && form.cardBadgePosition === 'top' && (
                      <div className="mb-3"><span className="px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest" style={{ backgroundColor: form.accentColor, color: form.accentForegroundColor }}>Selo</span></div>
                    )}
                    
                    <div className="flex justify-center mb-3">
                      <div className="bg-slate-100 rounded-md overflow-hidden relative shadow-inner" style={{ 
                        width: `${form.cardPhotoSize}%`, 
                        aspectRatio: form.cardPhotoAspectRatio === '3/4' ? '3/4' : '1/1'
                      }}>
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Users size={20} /></div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-black text-xs leading-tight" style={{ color: form.nameColor }}>João Silva</h3>
                      <p className="text-[9px] font-medium" style={{ color: form.jobTitleColor }}>Diretor Executivo</p>
                    </div>

                    {form.cardShowBadge && form.cardBadgePosition === 'bottom' && (
                      <div className="mt-3 pt-1"><span className="px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest" style={{ backgroundColor: form.accentColor, color: form.accentForegroundColor }}>Selo</span></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed">
            <p className="text-[10px] text-muted-foreground uppercase font-bold text-center">Controle de Cores</p>
            <div className="mt-2 space-y-2">
               <div className="flex items-center gap-2 text-[10px] font-bold"><div className="h-3 w-3 rounded border" style={{ backgroundColor: form.hoverColor }} /> Hover/Mouse</div>
               <div className="flex items-center gap-2 text-[10px] font-bold"><div className="h-3 w-3 rounded border" style={{ backgroundColor: form.accentColor }} /> Acento (Selo)</div>
               <div className="flex items-center gap-2 text-[10px] font-bold"><div className="h-3 w-3 rounded border" style={{ backgroundColor: form.accentForegroundColor }} /> Texto Selo</div>
               <div className="flex items-center gap-2 text-[10px] font-bold"><div className="h-3 w-3 rounded border" style={{ backgroundColor: form.subCategoryColor }} /> Subcategoria</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
