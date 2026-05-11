# Auditoria estrutural — hipvaa vs lemehubapp-main

Backend: `twpqlvxvhloipqeilxre`. Data: 2026-05-11.

## Sumário

| Categoria | Lemehub | Hip-vaa-app | Gap |
|---|---|---|---|
| Hooks | 117 | 40 | ~30 críticos + ~25 importantes + ~25 cosméticos |
| Componentes domain reusáveis | ~150 | ~15 | massivo |
| Edge functions invocadas no client | 52 | 12 | ~40 prontas no backend mas não chamadas |
| Rotas | ~80 | ~60 | 14 críticas + ~20 internas admin |
| Providers (Theme/PWA/Push/ErrorBoundary) | 5 ativos | 0 | total |
| `tenants.settings_json` flags respeitadas | 30+ | 1 (`community_moderation_enabled`) | quase total |
| Permissions granulares | 22 flags via `usePermissions` | 4 binárias (isAdmin/isStaff/isStudent/isSuper) | alto |
| PWA (manifest + sw + push) | sim | nao | total |
| Layouts persistentes (Outlet+Sidebar+BottomNav) | sim | nao | alto |

## Top 10 gaps CRÍTICOS

1. **AdminLayout com Outlet + Sidebar + BottomNav admin persistentes** — hoje cada `/admin/X` é página isolada.
2. **`usePermissions` granular (22 flags)** — sem isso, finance vê coach, coach vê financeiro.
3. **`useFeatureFlags` + `businessTemplates.ts` + leitura completa de settings_json** — 30+ flags ignoradas.
4. **PWA completo** (vite-plugin-pwa, manifest, sw-push, usePWA, InstallBanner, UpdateBanner, PushNotificationBanner, BUILD_ID killswitch) — sem isso não há instalação nem push.
5. **ErrorBoundary global** — qualquer crash quebra app inteiro.
6. **ThemeProvider que aplica `settings_json.theme`** em CSS vars (workaround sem coluna theme_json).
7. **Fluxo `/assinar/*`** (TenantSignup + Contract + Payment + Success).
8. **Fluxo `/contrato-ad/*`** (4 telas + GenerateAdContractDialog).
9. **`FreeStudentSignup` + `FreeDropInSignup`** + edges create-free-* — gratuito não funciona.
10. **`useInvoices` + InvoiceCard com QR + polling PIX** no Plano do aluno.

## Top 10 IMPORTANTES

1. NotificationBell admin + student + `useAdminNotifications`
2. AvatarUpload + ImageCropper + crops por bucket
3. HealthQuestionnaireDialog no aluno (preencher questionário)
4. ConsentDialog LGPD + edge generate-consent-pdf
5. AdminDashboard cards reais (não mock)
6. InvoiceAlert + TenantInvoiceAlert (banners de vencimento)
7. CRUD de Classes admin (criar aulas)
8. CrewOrganizer completo (drag-drop de assentos)
9. AppHeader com sininho + TenantSwitcher
10. NFS-e tab admin + edges emit/send/check

## Top 10 COSMÉTICOS

1. TourRunner (joyride) — desativado mesmo no lemehub
2. Strava integration completa
3. Coach Personal template (assessments, hrZones, runningTest)
4. Maintenance banner
5. TenantSwitcher (multi-tenant user)
6. Service contracts SaaS (super)
7. PartnerIntegrationCard
8. Banner Carousel (rotação automática)
9. SizeGrid report (loja)
10. Generate manual contract dialog

## Riscos / bloqueadores

1. Schema gaps já mapeados em WP: `tenants.theme_json`, `students.checkin_pin`, `pending_ad_contracts`
2. `feature_flags` — lemehub usa coluna separada, hipvaa tem só `settings_json` → workaround: `settings_json.feature_flags`
3. Buckets `banners`, `products`, `partners` (autorização do user já dada mas MCP read-only bloqueou)
4. `save-payment-method` edge — provavelmente não existe
5. Push VAPID keys — precisam estar configuradas no Supabase
6. **Decisão arquitetural pendente**: manter camada `/equipe/*` ou consolidar tudo em `/admin` com `usePermissions`?
7. TourRunner pode nunca ser portado
8. `NextThemesProvider` — não portar (conflita com design hv-* customizado)

## Plano em 8 ondas (~50h subagent paralelo / ~80h sequencial)

### Wave 1 — Fundação arquitetural [bloqueia tudo] (~6h, 3 subagents)
- A: `businessTemplates.ts`, `useFeatureFlags`, expandir `useTenant` com TenantSettings tipado (40+ campos), `usePermissions`
- B: `ErrorBoundary` global, `ThemeProvider` aplica `settings_json.theme` em CSS vars
- C: `AdminLayout` com Outlet + Sidebar desktop + BottomNav admin mobile; refatorar rotas `/admin/*` para nested

### Wave 2 — PWA completo (~5h, 2 subagents)
- A: vite-plugin-pwa, manifest, sw-push.js, ícones, SW registration + killswitch BUILD_ID em main.tsx
- B: hooks `usePWA`/`usePushNotifications`/`usePushDiagnostics`/`useForceUpdate` + componentes `InstallBanner`/`UpdateBanner`/`PushNotificationBanner`/`PushNotificationToggle`

### Wave 3 — Public flows críticos (~7h, 3 subagents)
- A: `/assinar/*` (4 telas) + `useTenantSignup` + `useCnpjLookup` + `BusinessTemplateSelector` + edges create-pending-tenant/sign-tenant-contract/process-tenant-payment
- B: `FreeStudentSignup` + `FreeDropInSignup` + `DropInScheduled` + edges create-free-signup/create-free-drop-in/schedule-drop-in
- C: `/contrato-ad/*` (4 telas) + `useAdContracts` + `useAdContractSignup` — confirmar tabela `pending_ad_contracts` antes

### Wave 4 — Admin core (~8h, 4 subagents)
- A: `admin/Classes` CRUD + ClassCard/Dialog/Form com cancel/rules + `admin/Coach` com checkin/cancelar/criar sessões
- B: `admin/Alunos` lista + StudentDetails (incl DropIn e Partner) + componentes Students/*
- C: `admin/Financeiro` + `admin/Faturas` TenantInvoices + `admin/Relatorios` real com Financial/Invoices/Reports components
- D: `admin/Mais` + AppHeader + AdminNotificationBell + NotificationSheet + InvoiceAlert/TenantInvoiceAlert

### Wave 5 — Student core wiring (~6h, 3 subagents)
- A: `Home` consolidada via `useStudentHome` (boats_enabled, multiDayCheckin, banners, alerts) + StatsGrid/TodayClassCard/BannerCarousel
- B: `Checkin` respeitando todos settings (day_mode, replacement, delinquency_tolerance, ranking, free_period, opens/closes_hours) + CheckinRanking + FreeCheckinCalendar + MultiDayCheckin + CheckInClassCard
- C: `Plano`/`Pedidos` com InvoiceCard + QR + polling, SavedCardsManager + edge save-payment-method, HealthQuestionnaireDialog + ConsentDialog

### Wave 6 — Comunidade & Banners & Parceiros (~5h, 2 subagents)
- A: refatorar `student/Comunidade` com FeedPost/CommentItem/CommentsSheet/PostDialog/EmojiPickerButton + PartnerStrip. `useNewCommunityPosts` badge. Respeitar `community_post_expiry_days`
- B: `admin/Banners` com BannerCard/Dialog/Form/ImageCropper + bucket; `admin/Parceiros` completo + `admin/Avisos` (Announcements) com push via send-push-notification + tracking analytics

### Wave 7 — Crew / Workouts / Coach (~7h, 3 subagents)
- A: `admin/Equipes` com TeamSheets + `admin/CrewSummary` com CrewOrganizer + BoatCrewCard + SeatPosition
- B: `admin/Workouts` + AdminWorkoutDetail + `admin/Biblioteca` com ExerciseFields/VideoUpload/SaveTemplate/LoadTemplate. Bucket exercise-videos
- C: Treino student real (WorkoutExecution + WorkoutResult + RPESelector + FinishWorkoutModal + SkipWorkoutModal) + HeartRateZonesTable + StatsGrid evolução

### Wave 8 — Super Admin + polimento (~6h, 3 subagents)
- A: SuperAdminLayout com Outlet + Sidebar + BottomNav + MoreSheet; `/rede/login` dedicado; `useSuperAdminFinancial` completo
- B: PendingSignupCard + usePendingTenantSignups + SignupLinkDialog (cupons) + TenantDocumentUploadDialog + GenerateContractDialog + ServiceContracts
- C: BannerCarousel embla + Markdown editor real em Termos (react-markdown) + Strava connect/disconnect + NfseConfigTab + edges nfse. Decidir destino de `/equipe/*`

## Caminho mínimo para app utilizável

Wave 1 + Wave 2 + escopo reduzido Wave 4 (só AdminLayout sem todas telas internas) + Wave 5 (Checkin respeitando settings + Plano com fatura PIX). **~20h**.
