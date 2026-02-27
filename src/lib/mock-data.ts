
import { Setor, Funcionario } from "@/types";

export const MOCK_SETORES: Setor[] = [
  { id: "1", nome: "Diretoria", data_criacao: new Date().toISOString() },
  { id: "2", nome: "Tecnologia", data_criacao: new Date().toISOString() },
  { id: "3", nome: "Recursos Humanos", data_criacao: new Date().toISOString() },
  { id: "4", nome: "Marketing", data_criacao: new Date().toISOString() },
  { id: "5", nome: "Financeiro", data_criacao: new Date().toISOString() },
];

export const MOCK_FUNCIONARIOS: Funcionario[] = [
  {
    id: "f1",
    nome: "Carlos Eduardo",
    cargo: "CEO",
    foto_url: "https://picsum.photos/seed/emp1/400/400",
    setor_id: "1",
    status: "ativo",
    data_criacao: new Date().toISOString()
  },
  {
    id: "f2",
    nome: "Juliana Silva",
    cargo: "Diretora de Marketing",
    foto_url: "https://picsum.photos/seed/emp3/400/400",
    setor_id: "4",
    status: "ativo",
    data_criacao: new Date().toISOString()
  },
  {
    id: "f3",
    nome: "Ricardo Santos",
    cargo: "Desenvolvedor Sênior",
    foto_url: "https://picsum.photos/seed/emp2/400/400",
    setor_id: "2",
    status: "ativo",
    data_criacao: new Date().toISOString()
  },
  {
    id: "f4",
    nome: "Mariana Costa",
    cargo: "Gerente de RH",
    foto_url: "https://picsum.photos/seed/emp4/400/400",
    setor_id: "3",
    status: "ativo",
    data_criacao: new Date().toISOString()
  },
  {
    id: "f5",
    nome: "Pedro Oliveira",
    cargo: "Analista Financeiro",
    foto_url: "https://picsum.photos/seed/emp5/400/400",
    setor_id: "5",
    status: "ativo",
    data_criacao: new Date().toISOString()
  }
];
