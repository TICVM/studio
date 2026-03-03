# PessoasEmpresa - Carômetro Corporativo

Este é um sistema de gestão visual de colaboradores (Carômetro) desenvolvido com **Next.js 15**, **Tailwind CSS**, **Shadcn/UI** e **Firebase**.

## 🚀 Como abrir o Terminal

Antes de publicar, você precisa abrir o terminal na pasta do seu projeto:
- **Windows**: Procure por "PowerShell" ou "Terminal" no menu Iniciar.
- **Mac**: Pressione `Command + Espaço` e digite "Terminal".
- **VS Code**: Use o atalho `Ctrl + '` (crase) para abrir o terminal interno.

## 📦 Como publicar no GitHub

Siga os passos abaixo no seu terminal (na pasta raiz do projeto):

1. **Inicie o repositório local:**
   ```bash
   git init
   ```

2. **Adicione os arquivos ao palco (stage):**
   ```bash
   git add .
   ```

3. **Crie o primeiro commit:**
   ```bash
   git commit -m "Initial commit: Carômetro completo com Estúdio Visual e Painel Admin"
   ```

4. **Conecte ao seu repositório remoto:**
   - Crie um novo repositório vazio no seu [GitHub](https://github.com/new).
   - Copie a URL do repositório (ex: `https://github.com/seu-usuario/seu-repositorio.git`).
   - No terminal, execute:
     ```bash
     git remote add origin https://github.com/seu-usuario/seu-repositorio.git
     git branch -M main
     git push -u origin main
     ```

## ✨ Funcionalidades

- **Painel Público:** Visualização de colaboradores com filtros por Nome, Cargo, Setor e Unidade.
- **Área Administrativa:** Gestão completa de Funcionários (com edição em massa de unidade) e Setores.
- **Estúdio Visual:** Personalização total de cores, logos e layout dos cards diretamente pelo navegador.
- **Importação:** Suporte para importação de dados via planilhas Excel.
- **Sincronização em Tempo Real:** Banco de dados Firestore com atualizações instantâneas.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Banco de Dados & Auth:** [Firebase](https://firebase.google.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **IA:** [Genkit](https://firebase.google.com/docs/genkit) (Configurado para expansões futuras)

---
Desenvolvido como um protótipo funcional para gestão organizacional.
