# Hip Va'a APP

PWA mobile-first do clube de canoa havaiana. Frontend novo do design v2 (Hip Va'a Hi-fi from claude.ai/design), reaproveitando o backend Supabase do `hip-vaa-hub`.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** com tokens HV (paleta oceânica)
- **React Query** pra data fetching
- **React Router** pro client-side routing
- **Supabase JS** pro backend (auth + RLS + edge functions + realtime)

## Backend

Conecta no Supabase **`twpqlvxvhloipqeilxre`** (mesmo backend do `hip-vaa-hub`). Todas as tabelas, edge functions, RLS, dados de teste e cron jobs são compartilhados.

## Setup

```bash
cp .env.example .env       # se ainda não existir
npm install
npm run dev                # http://localhost:5173
```

## Estrutura

```
src/
├── App.tsx                # Rotas + providers
├── components/            # Button, Input, TabBar, PageScaffold, Loader, HVLogo
├── hooks/                 # useAuth, useTenant, useStudent, useTours, useReferrals
├── lib/                   # supabase client, utils, HVIcon (40 ícones SVG)
├── pages/
│   ├── Auth.tsx           # Login (gradient ocean)
│   ├── student/           # PWA aluno (Home, Checkin, Aulas, Plano, Loja, Passeios, Indicacoes, Recompensas, Perfil)
│   ├── equipe/            # Admin filial / Instrutor / Recepção (multi-papel)
│   ├── super/             # SuperAdmin (rede de franquias)
│   └── public/            # TourLanding (landpage pública /tours/:slug)
└── index.css              # Design system tokens
```

## Login dos usuários de teste

| Tipo | Email | Senha |
|---|---|---|
| Aluno | `aluno@hipvaa.test` | `aluno12` |
| Admin filial | `lucas.henrique47@hotmail.com` | `lucas12` |
| SuperAdmin | `lucasshso@gmail.com` | `lucas12` |

## Build

```bash
npm run build              # gera dist/
npm run preview            # preview local
```
