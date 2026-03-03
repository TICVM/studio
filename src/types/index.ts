
export interface Setor {
  id: string;
  nome: string;
  ordem?: number;
  subcategorias?: string[];
  layoutSubcategorias?: 'stack' | 'grid';
  colunasGrid?: number;
  data_criacao: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  foto_url: string;
  setor_id: string;
  subcategoria?: string; 
  status: 'ativo' | 'inativo';
  is_lider?: boolean;
  titulo_lider?: string;
  email?: string;
  ramal?: string;
  unidade?: string;
  data_criacao: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin';
}

export interface SystemSettings {
  systemName: string;
  heroTitle?: string;
  countLabel?: string;
  logoUrl: string;
  primaryColor: string;
  leadershipColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  foregroundColor?: string;
  accentColor?: string;
  accentForegroundColor?: string;
  hoverColor?: string;
  nameColor?: string;
  jobTitleColor?: string;
  sectorHeaderColor?: string;
  subCategoryColor?: string;
  sidebarBackgroundColor?: string;
  sidebarForegroundColor?: string;
  logoStyle: 'square_with_name' | 'rectangular_no_name';
  logoHeight?: number;
  cardPadding?: number;
  cardBorderRadius?: number;
  cardShowShadow?: boolean;
  cardTextAlign?: 'left' | 'center';
  cardPhotoSize?: number;
  cardPhotoAspectRatio?: '3/4' | '1/1' | '4/5' | '2/3';
  cardShowBadge?: boolean;
  cardBadgePosition?: 'top' | 'bottom';
  headerStyle?: 'line_right' | 'full_underline' | 'box_background';
  headerFontSize?: number;
}
