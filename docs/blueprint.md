# **App Name**: PessoasEmpresa

## Core Features:

- Autenticação Administrativa: Permitir que usuários administradores acessem a área restrita com login e senha seguros.
- Gestão de Setores: Funcionalidades de CRUD (Criar, Ler, Atualizar, Deletar) para gerenciar os setores da empresa.
- Gestão de Funcionários: Funcionalidades de CRUD (Criar, Ler, Atualizar, Deletar) para gerenciar funcionários, incluindo upload de foto, nome, cargo, setor e status.
- Exibição Pública de Carômetro: Exibir todos os funcionários ativos em formato de grade (carômetro), organizados por setor.
- Busca e Filtragem de Funcionários: Fornecer filtros por setor e um campo de busca por nome para facilitar a localização de funcionários na página pública.
- Integração de Banco de Dados: Conectar e interagir com um banco de dados PostgreSQL (via Supabase) para armazenar dados de setores, funcionários e usuários.
- Armazenamento e Exibição de Imagens: Gerenciar o upload de fotos de funcionários via Supabase Storage e exibi-las dinamicamente no carômetro.

## Style Guidelines:

- Esquema de cores claro, focado em tons corporativos e limpos. Cor primária: um azul profundo (#336699), evocando profissionalismo e confiança. Cor de fundo: um azul muito claro e desaturado (#E6EDF2) para um ambiente sereno e discreto. Cor de destaque: um ciano sutilmente mais claro (#66BBDB) para elementos interativos e chamadas à ação.
- A fonte principal e para títulos será 'Inter' (sans-serif), escolhida por sua estética moderna, objetiva e legibilidade em diversos tamanhos, ideal para uma interface corporativa e funcional.
- Utilizar um conjunto de ícones modernos e minimalistas, de estilo linha, para complementar o design limpo. Ícones de ações (editar, excluir, pesquisar, filtrar) devem ser discretos, mas facilmente identificáveis.
- O layout em grade do carômetro apresentará cards de funcionários com sombras suaves, transmitindo uma sensação de profundidade sem sobrecarregar. Fotos circulares darão um toque moderno e amigável. Nome do funcionário em destaque e cargo em fonte ligeiramente menor, mantendo uma hierarquia visual clara. Os setores serão agrupados com um título acima, para facilitar a organização. Design totalmente responsivo para desktop e mobile.
- Animações sutis e rápidas nos elementos de interação, como efeitos hover nos cards do carômetro ou transições leves na exibição de detalhes ao filtrar, para aprimorar a experiência do usuário sem distrair.