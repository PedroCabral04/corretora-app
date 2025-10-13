<div align="center">
  <h1>🏢 Corretora App</h1>
  <p><strong>Sistema completo de gestão para corretores de imóveis e agências imobiliárias</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
</div>

---

## 📖 Sobre o Projeto

**Corretora App** é uma plataforma web desenvolvida inicialmente para gerenciar as operações de uma agência de corretores de imóveis. O sistema oferece ferramentas completas para gestão de corretores, clientes, vendas, tarefas, agenda e metas.

Este projeto nasceu de uma necessidade real de uma gerente de agência imobiliária e está sendo disponibilizado publicamente para que outros profissionais do setor possam utilizá-lo e adaptá-lo às suas necessidades.

### ✨ Funcionalidades Principais

- 👥 **Gestão de Corretores** - Cadastro completo com histórico de vendas e performance
- 📊 **Dashboard Analítico** - Métricas em tempo real e gráficos de performance
- 🎯 **Metas e Objetivos** - Acompanhamento de metas individuais e da equipe
- 📅 **Agenda Integrada** - Calendário com eventos, reuniões e lembretes
- ✅ **Gerenciamento de Tarefas** - Sistema Kanban para organização de atividades
- 💰 **Controle de Vendas** - Registro e acompanhamento de vendas e comissões
- 🔔 **Notificações Inteligentes** - Alertas automáticos de prazos e metas
- 🔐 **Sistema de Permissões** - 4 níveis de acesso (Admin, Manager, Broker, Viewer)
- 📱 **Design Responsivo** - Interface adaptável para desktop, tablet e mobile

## 🚀 Tecnologias

Este projeto foi desenvolvido com as seguintes tecnologias:

| Tecnologia | Descrição |
|------------|-----------|
| ⚡ **Vite** | Build tool moderna e dev server ultra-rápido |
| ⚛️ **React 18** | Biblioteca JavaScript para construção de interfaces |
| 🔷 **TypeScript** | Superset JavaScript com tipagem estática |
| 🗄️ **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, Storage) |
| 🎨 **shadcn/ui** | Componentes de UI reutilizáveis e acessíveis |
| 💅 **Tailwind CSS** | Framework CSS utility-first |
| 🧪 **Vitest** | Framework de testes unitários e de integração |
| 📊 **Recharts** | Biblioteca para gráficos e visualizações |
| 🎯 **React Router** | Roteamento client-side |
| 🔄 **React Query** | Gerenciamento de estado do servidor |

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) 18 ou superior
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta gratuita no [Supabase](https://supabase.com/) (para configuração do backend)

## 🔧 Instalação e Configuração

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/PedroCabral04/broker-wingman-pro.git
cd broker-wingman-pro
```

### 2️⃣ Instale as Dependências

```bash
npm install
```

### 3️⃣ Configure o Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e a chave anônima do projeto
4. Execute as migrations do banco de dados:
   - Acesse o SQL Editor no dashboard do Supabase
   - Execute os arquivos SQL da pasta `supabase/migrations/` em ordem cronológica

### 4️⃣ Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

> ⚠️ **Importante:** Nunca commite o arquivo `.env.local` com suas credenciais reais!

### 5️⃣ Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080` 🎉

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run build:dev` - Build de desenvolvimento
- `npm run lint` - Executa o linter
- `npm run preview` - Preview do build de produção
- `npm run test` - Executa testes em modo watch
- `npm run test:ui` - Executa testes com interface UI
- `npm run test:run` - Executa todos os testes (CI/CD)
- `npm run test:coverage` - Executa testes com relatório de cobertura

## 🧪 Testes

Este projeto utiliza **Vitest** com React Testing Library. Para mais informações sobre como escrever e executar testes, consulte o [Guia de Testes (TESTING.md)](./TESTING.md).

### Executar Testes

```sh
# Modo watch (desenvolvimento)
npm run test

# Uma vez (CI/CD)
npm run test:run

# Com interface UI
npm run test:ui

# Com cobertura
npm run test:coverage
```

Os testes são executados automaticamente no processo de build da Vercel. Se algum teste falhar, o deploy será bloqueado.

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

## 🔐 Autenticação e Segurança

O sistema utiliza **Supabase Auth** com recursos avançados de segurança:

- 🔑 Login/Registro com email e senha
- 📧 Recuperação de senha por email
- 👤 Sistema de perfis de usuário
- 🛡️ Row Level Security (RLS) no banco de dados
- 🔒 4 níveis de permissão:
  - **Admin**: Acesso total ao sistema
  - **Manager**: Gerenciamento de corretores e vendas
  - **Broker**: Acesso aos próprios dados e clientes
  - **Viewer**: Apenas visualização

## 🚀 Deploy

### Vercel (Recomendado)

Este projeto está configurado para deploy na Vercel:

1. Fork este repositório
2. Conecte seu fork à [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push!

> 💡 Os testes são executados automaticamente antes de cada deploy

### Outras Plataformas

O projeto também pode ser hospedado em:
- Netlify
- AWS Amplify
- Firebase Hosting
- GitHub Pages (com algumas configurações)

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Este projeto foi criado para a comunidade e pode ser melhorado por qualquer pessoa.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### 📝 Diretrizes de Contribuição

- Escreva testes para novas funcionalidades
- Siga o padrão de código existente
- Documente mudanças significativas
- Teste localmente antes de enviar PR

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/PedroCabral04/broker-wingman-pro/issues) detalhando:

- Descrição do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots (se aplicável)
- Ambiente (navegador, OS, etc.)

## 💡 Roadmap

Funcionalidades planejadas para futuras versões:

- [ ] Integração com WhatsApp Business API
- [ ] Relatórios PDF exportáveis
- [ ] Aplicativo mobile (React Native)
- [ ] Sistema de chat interno
- [ ] Integração com CRMs externos
- [ ] Dashboard público para clientes
- [ ] Modo offline (PWA)

## 👏 Agradecimentos

Este projeto foi desenvolvido para atender às necessidades reais de gestão imobiliária e está disponível gratuitamente para a comunidade.

Agradecimentos especiais a todos que contribuírem para tornar este projeto ainda melhor!

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com ❤️ para a comunidade de corretores de imóveis</p>
  <p>⭐ Se este projeto foi útil para você, considere dar uma estrela!</p>
  
  <p>
    <a href="https://github.com/PedroCabral04/broker-wingman-pro/issues">Reportar Bug</a>
    ·
    <a href="https://github.com/PedroCabral04/broker-wingman-pro/issues">Sugerir Feature</a>
  </p>
</div>
