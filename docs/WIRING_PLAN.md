# Plano de wiring lemehubapp → hip-vaa-app

Backend mantido: Supabase `twpqlvxvhloipqeilxre` (Hip Va'a).
Referência de lógica: `lemehubapp-main` (Supabase `myqwbkkunhjattgsfjnp`).
Data: 2026-05-10.

## Validação de schema (twpqlvxvhloipqeilxre)

### Tabelas/colunas confirmadas

| Item | Status |
|---|---|
| `tenants.settings_json` (jsonb) | ✓ existe |
| `tenants.contract_text` (text) | ✓ existe |
| `tenants.drop_in_contract_text` (text) | ✓ existe |
| `checkins.guest_name` (nullable text) | ✓ existe |

### Gaps de schema

| Item | Status | Workaround proposto |
|---|---|---|
| `tenants.theme_json` (jsonb) | ✗ NÃO existe | Usar `settings_json.theme` ao invés de coluna dedicada |
| `students.checkin_pin` (char(4)) | ✗ NÃO existe | Gerar PIN determinístico dos últimos 4 chars do student.id (ou criar coluna via migration) |
| `pending_ad_contracts` | ✗ NÃO existe como table | Edge `create-pending-ad-contract` existe — provável que use `signup_links` ou tabela alternativa. Inspecionar a edge antes de portar |

### Buckets de storage

| Bucket | Status |
|---|---|
| `community-posts` | ✓ existe |
| `exercise-videos` | ✓ existe |
| `tenant-assets` | ✓ existe |
| `banners` | ✗ NÃO existe — precisa criar |
| `products` | ✗ NÃO existe — precisa criar |
| `partners` | ✗ NÃO existe — precisa criar |

### Edge functions confirmadas

84 edge functions ativas em twpqlvxvhloipqeilxre. **Todas** as edges chamadas pelas telas do lemehub estão presentes:

**Signup/cadastro**: `create-pending-signup`, `create-free-signup`, `generate-signup-pix`, `signup-with-payment`, `cleanup-expired-signups`

**Drop-in**: `create-pending-drop-in`, `create-free-drop-in`, `generate-drop-in-pix`, `schedule-drop-in`, `charge-drop-in-card`, `convert-drop-in-to-student`

**Conversão**: `complete-conversion`, `generate-conversion-pix`, `create-conversion-link`

**Tenant signup**: `create-pending-tenant`, `sign-tenant-contract`, `process-tenant-payment`, `generate-tenant-invoice-pix`, `send-tenant-reminders`

**Contratos AD**: `create-pending-ad-contract`, `update-ad-contract-data`, `sign-ad-contract`, `generate-ad-contract-payment`, `generate-ad-contract-pix`, `complete-ad-contract`, `check-ad-contract-overdue`, `send-ad-contract-reminders`

**Loja**: `create-product-order`

**Admin**: `create-team-member`, `admin-delete-user`, `admin-create-student`, `admin-delete-student`, `admin-delete-tenant`

**Auth**: `send-recovery-email`

**Push/email/wpp**: `send-push-notification`, `send-whatsapp-message`, `send-smtp-email`, `send-checkin-reminders`, `send-invoice-reminders`, `send-invoice-notification`

**Super**: `create-tenant`, `create-superadmin`, `auto-suspend-tenants`

**Invoices**: `create-tenant-invoice`, `cancel-tenant-invoice`, `delete-tenant-invoice`, `generate-monthly-invoices`, `generate-tenant-invoices`, `auto-charge-invoices`, `check-delinquent-students`

**Strava**: `strava-auth`, `strava-webhook`, `strava-disconnect`, `cleanup-strava-imports`

**PDF/NFS**: `generate-consent-pdf`, `generate-manual-contract`, `emit-nfse`, `check-nfse-status`, `send-nfse-email`, `test-nfse-connection`

**Hip Va'a-only**: `create-tour-booking`, `generate-royalty-invoices`

## Telas a wirear (referência rápida)

### Aluno (10 telas)
- `student/Checkin.tsx` — adicionar botão check-in inline em cada card de aula
- `student/CheckinPin.tsx` — adicionar submit (depende de `students.checkin_pin` ou workaround)
- `student/Loja.tsx` — substituir mock por `useActiveProducts()` + edge `create-product-order`
- `student/Cadastro.tsx` — porte completo de `StudentSignup.tsx` do lemehub
- `student/Comunidade.tsx` — adicionar create/like/comentar (já tem read)
- `student/Treino.tsx` — execução com RPE + grava `training_sessions`
- `student/ResultadoTreino.tsx` — stats + Strava reconfirm
- `student/Avulso.tsx` — fluxo drop-in (decidir aluno-logado vs público)
- `student/MeusPedidos.tsx` — já tem read; adicionar pagar PIX pendente
- `student/Parceiros.tsx` — adicionar tracking `partner_analytics`

### Admin (16 telas)
- `admin/Banners.tsx` — CRUD + upload (precisa bucket `banners`)
- `admin/Tema.tsx` — persist em `settings_json.theme` (workaround sem `theme_json`)
- `admin/Termos.tsx` — UPDATE `tenants.contract_text` + `drop_in_contract_text`
- `admin/Produtos.tsx` — CRUD + upload (precisa bucket `products`)
- `admin/PedidosLoja.tsx` — update status
- `admin/Usuarios.tsx` — `create-team-member` + edit role
- `admin/Questionario.tsx` — CRUD `health_questionnaire_fields`
- `admin/Biblioteca.tsx` — CRUD `workout_templates` + `exercise_library`
- `admin/Equipes.tsx` — CRUD `crew_templates` + seats
- `admin/Comunidade.tsx` — aprovar/rejeitar posts
- `admin/Parceiros.tsx` — CRUD + actions
- `admin/Locais.tsx` — CRUD `venues`
- `admin/Canoas.tsx` — CRUD `boats`
- `admin/Planos.tsx` — CRUD `plans`

### Equipe (2)
- `equipe/CoachCrew.tsx` — view real de `crew_assignments` por data
- `equipe/InstrutorChamada.tsx` — INSERT/DELETE `checkins` + guest check-in

### Super (1)
- `super/CriarTenant.tsx` — `create-tenant` + possivelmente `franchise_contracts`

### Novas a criar (públicas — 14 telas)
- `/converter/:token/*` — ConvertStudent + Payment + Success (3 telas)
- `/assinar/*` — TenantSignup + Contract + Payment + Success (4 telas)
- `/contrato/:contractId` + `/pdf` — ContractSign + View (2 telas)
- `/contrato-ad/:token/*` — AdContract Signup + Sign + Payment + Success (4 telas)
- `/esqueci-senha`, `/resetar-senha`, `/privacidade` (3 telas)

### Novas admin a criar (5)
- `admin/CrewSummary` (ou reusar equipe/CoachCrew)
- `admin/Avisos` (Announcements — separar de Banners)
- `admin/FaturasFilial` (tenant_invoices)
- `admin/Coach` (cancelar aulas + criar sessões)
- `admin/Workouts` + `admin/Treino/:sessionId` detalhe

## Ordem sugerida de implementação

1. **Pré-requisitos infra** (autorização explícita necessária):
   - Criar buckets `banners`, `products`, `partners` em storage
   - Decidir: migration pra `students.checkin_pin` e `tenants.theme_json` ou workarounds
2. **Hooks base + lib helpers**: `cpf.ts`, `phone.ts`, `useCepLookup`, `uploadValidation`, `usePermissions`, `useCheckins`, `usePublicSignup`, etc.
3. **Auth flow**: esqueci-senha + reset
4. **Aluno - Checkin real** + InstrutorChamada (CRUD checkins)
5. **Aluno - Loja/MeusPedidos** wiring
6. **Aluno - Cadastro público** + **Avulso público**
7. **Aluno - Converter** (3 telas)
8. **Aluno - Treino/Resultado** + Comunidade CRUD
9. **Admin - CRUD batch**: Banners, Produtos, PedidosLoja, Tema, Termos, Comunidade, Parceiros, Locais, Canoas, Planos
10. **Admin - extras**: Equipes, Biblioteca, Questionario, Usuarios, Avisos, Faturas, Coach, Workouts
11. **Super - CriarTenant** + decisão franchise_contracts
12. **Public - Assinar tenant** (4 telas)
13. **Public - Contratos serviço/Ad** (6 telas) — depende de validar `pending_ad_contracts`

## Riscos críticos

1. **`pending_ad_contracts` não existe como tabela** — edges existem, mas tabela referenciada não. Antes de portar `/contrato-ad/*`, abrir source de `create-pending-ad-contract/index.ts` no lemehub e checar qual tabela ela escreve.

2. **`tenants.theme_json` ausente** — admin/Tema fica limitado a `settings_json.theme`, sem suporte de tipos.

3. **`students.checkin_pin` ausente** — CheckinPin tem 2 opções:
   - (a) gerar PIN determinístico dos últimos 4 chars do `student.id`, sem persistir
   - (b) criar migration `ALTER TABLE students ADD COLUMN checkin_pin char(4)` + UI admin para gerar/regerar PIN

4. **Hip Va'a tem `franchise_contracts`** — não existe no lemehub. Após `create-tenant`, precisa criar contrato de franquia (edge dedicada ou parte do `process-tenant-payment`).

5. **RLS de `checkins`** — verificar se permite INSERT/DELETE por coach do tenant antes de portar InstrutorChamada.
