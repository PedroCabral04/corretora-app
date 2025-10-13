# Broker Wingman Pro

Sistema de gestão pessoal e profissional para corretores de imóveis.

## 🚀 Tecnologias

Este projeto foi desenvolvido com:

- **Vite** - Build tool e dev server
- **React** - Library para UI
- **TypeScript** - Tipagem estática
- **Supabase** - Backend, autenticação e banco de dados
- **shadcn/ui** - Componentes de UI
- **Tailwind CSS** - Estilização

## 📋 Pré-requisitos

- Node.js 18+ e npm instalados
- Conta no Supabase (para configuração do backend)

## 🔧 Instalação

1. Clone o repositório:
```sh
git clone <YOUR_GIT_URL>
cd broker-wingman-pro
```

2. Instale as dependências:
```sh
npm install
```

3. Configure as variáveis de ambiente:
```sh
# Crie um arquivo .env.local com suas credenciais do Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Inicie o servidor de desenvolvimento:
```sh
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run build:dev` - Build de desenvolvimento
- `npm run lint` - Executa o linter
- `npm run preview` - Preview do build de produção

## 🗂️ Estrutura do Projeto

```
src/
├── components/     # Componentes React reutilizáveis
├── contexts/       # Context providers (estado global)
├── hooks/          # Custom hooks
├── integrations/   # Integrações (Supabase)
├── lib/            # Utilitários e helpers
├── pages/          # Páginas da aplicação
└── App.tsx         # Componente raiz
```

## 🔐 Autenticação

O sistema utiliza Supabase Auth com:
- Login/Registro de usuários
- Recuperação de senha por email
- Sistema de roles (admin, manager, broker, viewer)
- Row Level Security (RLS) no banco de dados

## 📄 Licença

Este projeto é privado e proprietário.
