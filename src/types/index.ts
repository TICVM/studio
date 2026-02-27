
export interface Setor {
  id: string;
  nome: string;
  data_criacao: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  foto_url: string;
  setor_ids: string[]; // Suporte a múltiplos setores
  status: 'ativo' | 'inativo';
  is_lider?: boolean;
  titulo_lider?: string; // Título personalizado (ex: Coordenador, Diretor)
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
