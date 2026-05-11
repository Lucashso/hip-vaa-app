import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/Loader";
import { PageLoader } from "@/components/PageLoader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminLayout } from "@/components/Layout/AdminLayout";
import { InstallBanner, UpdateBanner, PushNotificationBanner } from "@/components/PWA";

import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";

const StudentHome = lazy(() => import("@/pages/student/Home"));
const StudentCheckin = lazy(() => import("@/pages/student/Checkin"));
const StudentAulas = lazy(() => import("@/pages/student/Aulas"));
const StudentPlano = lazy(() => import("@/pages/student/Plano"));
const StudentLoja = lazy(() => import("@/pages/student/Loja"));
const StudentPasseios = lazy(() => import("@/pages/student/Passeios"));
const StudentIndicacoes = lazy(() => import("@/pages/student/Indicacoes"));
const StudentRecompensas = lazy(() => import("@/pages/student/Recompensas"));
const StudentPerfil = lazy(() => import("@/pages/student/Perfil"));
const StudentCadastro = lazy(() => import("@/pages/student/Cadastro"));
const StudentComunidade = lazy(() => import("@/pages/student/Comunidade"));
const StudentEvolucao = lazy(() => import("@/pages/student/Evolucao"));
const StudentTreino = lazy(() => import("@/pages/student/Treino"));
const StudentResultadoTreino = lazy(() => import("@/pages/student/ResultadoTreino"));
const StudentMeusPedidos = lazy(() => import("@/pages/student/MeusPedidos"));
const StudentParceiros = lazy(() => import("@/pages/student/Parceiros"));

const PublicCadastroPagamento = lazy(() => import("@/pages/public/CadastroPagamento"));
const PublicCadastroSucesso = lazy(() => import("@/pages/public/CadastroSucesso"));
const PublicCadastroGratuito = lazy(() => import("@/pages/public/CadastroGratuito"));
const PublicAvulso = lazy(() => import("@/pages/public/Avulso"));
const PublicAvulsoPagamento = lazy(() => import("@/pages/public/AvulsoPagamento"));
const PublicAvulsoSucesso = lazy(() => import("@/pages/public/AvulsoSucesso"));
const PublicAvulsoGratuito = lazy(() => import("@/pages/public/AvulsoGratuito"));
const PublicAvulsoAgendado = lazy(() => import("@/pages/public/AvulsoAgendado"));

// Páginas que vivem em src/pages/equipe/ mas agora respondem a /admin/*.
const AdminHome = lazy(() => import("@/pages/equipe/FilialHome"));
const AdminRoleSwitcher = lazy(() => import("@/pages/equipe/RoleSwitcher"));
const AdminFilialEquipe = lazy(() => import("@/pages/equipe/FilialEquipe"));
const AdminInstrutorAulas = lazy(() => import("@/pages/equipe/InstrutorAulas"));
const AdminInstrutorChamada = lazy(() => import("@/pages/equipe/InstrutorChamada"));
const AdminInstrutorEvolucao = lazy(() => import("@/pages/equipe/InstrutorEvolucao"));
const AdminCoachCrew = lazy(() => import("@/pages/equipe/CoachCrew"));
const AdminFilialFinanceiro = lazy(() => import("@/pages/equipe/FilialFinanceiro"));
const AdminAlunosLista = lazy(() => import("@/pages/equipe/AlunosLista"));
const AdminAlunoDetalhe = lazy(() => import("@/pages/equipe/AlunoDetalhe"));
const AdminFilialConfig = lazy(() => import("@/pages/equipe/FilialConfig"));

// Páginas que vivem em src/pages/admin/.
const AdminIndex = lazy(() => import("@/pages/admin/Index"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminPlanos = lazy(() => import("@/pages/admin/Planos"));
const AdminLocais = lazy(() => import("@/pages/admin/Locais"));
const AdminCanoas = lazy(() => import("@/pages/admin/Canoas"));
const AdminProdutos = lazy(() => import("@/pages/admin/Produtos"));
const AdminPedidosLoja = lazy(() => import("@/pages/admin/PedidosLoja"));
const AdminBanners = lazy(() => import("@/pages/admin/Banners"));
const AdminAvisos = lazy(() => import("@/pages/admin/Avisos"));
const AdminFaturas = lazy(() => import("@/pages/admin/Faturas"));
const AdminTreinos = lazy(() => import("@/pages/admin/Treinos"));
const AdminPerfil = lazy(() => import("@/pages/admin/Perfil"));
const AdminUsuarios = lazy(() => import("@/pages/admin/Usuarios"));
const AdminRelatorios = lazy(() => import("@/pages/admin/Relatorios"));
const AdminParceiros = lazy(() => import("@/pages/admin/Parceiros"));
const AdminBiblioteca = lazy(() => import("@/pages/admin/Biblioteca"));
const AdminQuestionario = lazy(() => import("@/pages/admin/Questionario"));
const AdminEquipes = lazy(() => import("@/pages/admin/Equipes"));
const AdminComunidade = lazy(() => import("@/pages/admin/Comunidade"));
const AdminTermos = lazy(() => import("@/pages/admin/Termos"));
const AdminAjuda = lazy(() => import("@/pages/admin/Ajuda"));

const SuperFiliais = lazy(() => import("@/pages/super/Filiais"));
const SuperTenantDetalhe = lazy(() => import("@/pages/super/TenantDetalhe"));
const SuperFinanceiro = lazy(() => import("@/pages/super/Financeiro"));
const SuperContratos = lazy(() => import("@/pages/super/Contratos"));
const SuperPlanosPlataforma = lazy(() => import("@/pages/super/PlanosPlataforma"));
const SuperAnalytics = lazy(() => import("@/pages/super/Analytics"));
const SuperBannersGlobais = lazy(() => import("@/pages/super/BannersGlobais"));
const SuperParceirosGlobais = lazy(() => import("@/pages/super/ParceirosGlobais"));
const SuperConfig = lazy(() => import("@/pages/super/Config"));
const SuperPushStats = lazy(() => import("@/pages/super/PushStats"));
const SuperCriarTenant = lazy(() => import("@/pages/super/CriarTenant"));
const TourLanding = lazy(() => import("@/pages/public/TourLanding"));
const ConverterStudent = lazy(() => import("@/pages/public/ConverterStudent"));
const ConverterPagamento = lazy(() => import("@/pages/public/ConverterPagamento"));
const ConverterSucesso = lazy(() => import("@/pages/public/ConverterSucesso"));
const Privacidade = lazy(() => import("@/pages/public/Privacidade"));
const ContratoAdSignup = lazy(() => import("@/pages/public/ContratoAdSignup"));
const ContratoAdSign = lazy(() => import("@/pages/public/ContratoAdSign"));
const ContratoAdPagamento = lazy(() => import("@/pages/public/ContratoAdPagamento"));
const ContratoAdSucesso = lazy(() => import("@/pages/public/ContratoAdSucesso"));
const EsqueciSenha = lazy(() => import("@/pages/EsqueciSenha"));
const ResetarSenha = lazy(() => import("@/pages/ResetarSenha"));
const AssinarSignup = lazy(() => import("@/pages/public/AssinarSignup"));
const AssinarContrato = lazy(() => import("@/pages/public/AssinarContrato"));
const AssinarPagamento = lazy(() => import("@/pages/public/AssinarPagamento"));
const AssinarSucesso = lazy(() => import("@/pages/public/AssinarSucesso"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function StudentOnly({ children }: { children: React.ReactNode }) {
  const { isStudent, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isStudent) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function StaffOnly({ children }: { children: React.ReactNode }) {
  const { isStaff, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SuperOnly({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * RedirectWithParams — preserva params dinâmicos ao redirecionar rotas legadas.
 * Ex.: /equipe/alunos/:id -> /admin/alunos/:id
 */
function RedirectWithParams({ to }: { to: string }) {
  const params = useParams();
  let path = to;
  Object.entries(params).forEach(([k, v]) => {
    path = path.replace(`:${k}`, v ?? "");
  });
  return <Navigate to={path} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <UpdateBanner />
            <InstallBanner />
            <PushNotificationBanner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Públicas */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="/resetar-senha" element={<ResetarSenha />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/privacy" element={<Privacidade />} />
                <Route path="/bem-vindo" element={<Onboarding />} />
                <Route path="/tours/:tenantSlug/:tourSlug" element={<TourLanding />} />
                <Route path="/cadastro" element={<StudentCadastro />} />
                <Route path="/cadastro/pagamento" element={<PublicCadastroPagamento />} />
                <Route path="/cadastro/sucesso" element={<PublicCadastroSucesso />} />
                <Route path="/cadastro/gratuito" element={<PublicCadastroGratuito />} />
                <Route path="/cadastro/:tenantSlug" element={<StudentCadastro />} />
                <Route path="/:slug/cadastro/pagamento" element={<PublicCadastroPagamento />} />
                <Route path="/:slug/cadastro/sucesso" element={<PublicCadastroSucesso />} />
                <Route path="/:slug/cadastro/gratuito" element={<PublicCadastroGratuito />} />
                <Route path="/avulso" element={<PublicAvulso />} />
                <Route path="/avulso/pagamento" element={<PublicAvulsoPagamento />} />
                <Route path="/avulso/sucesso" element={<PublicAvulsoSucesso />} />
                <Route path="/avulso/gratuito" element={<PublicAvulsoGratuito />} />
                <Route path="/avulso/agendado" element={<PublicAvulsoAgendado />} />
                <Route path="/:slug/avulso" element={<PublicAvulso />} />
                <Route path="/:slug/avulso/pagamento" element={<PublicAvulsoPagamento />} />
                <Route path="/:slug/avulso/sucesso" element={<PublicAvulsoSucesso />} />
                <Route path="/:slug/avulso/gratuito" element={<PublicAvulsoGratuito />} />
                <Route path="/:slug/avulso/agendado" element={<PublicAvulsoAgendado />} />
                <Route path="/converter/:token" element={<ConverterStudent />} />
                <Route path="/converter/:token/pagamento" element={<ConverterPagamento />} />
                <Route path="/converter/:token/sucesso" element={<ConverterSucesso />} />
                <Route path="/:slug/converter/:token" element={<ConverterStudent />} />
                <Route path="/:slug/converter/:token/pagamento" element={<ConverterPagamento />} />
                <Route path="/:slug/converter/:token/sucesso" element={<ConverterSucesso />} />
                <Route path="/contrato-ad/:token/cadastro" element={<ContratoAdSignup />} />
                <Route path="/contrato-ad/:token/contrato" element={<ContratoAdSign />} />
                <Route path="/contrato-ad/:token/pagamento" element={<ContratoAdPagamento />} />
                <Route path="/contrato-ad/:token/sucesso" element={<ContratoAdSucesso />} />
                <Route path="/assinar" element={<AssinarSignup />} />
                <Route path="/assinar/contrato" element={<AssinarContrato />} />
                <Route path="/assinar/pagamento" element={<AssinarPagamento />} />
                <Route path="/assinar/sucesso" element={<AssinarSucesso />} />

                {/* Aluno */}
                <Route path="/" element={<ProtectedRoute><StudentOnly><StudentHome /></StudentOnly></ProtectedRoute>} />
                <Route path="/checkin" element={<ProtectedRoute><StudentOnly><StudentCheckin /></StudentOnly></ProtectedRoute>} />
                <Route path="/aulas" element={<ProtectedRoute><StudentOnly><StudentAulas /></StudentOnly></ProtectedRoute>} />
                <Route path="/plano" element={<ProtectedRoute><StudentOnly><StudentPlano /></StudentOnly></ProtectedRoute>} />
                <Route path="/loja" element={<ProtectedRoute><StudentOnly><StudentLoja /></StudentOnly></ProtectedRoute>} />
                <Route path="/passeios" element={<ProtectedRoute><StudentOnly><StudentPasseios /></StudentOnly></ProtectedRoute>} />
                <Route path="/indicacao" element={<ProtectedRoute><StudentOnly><StudentIndicacoes /></StudentOnly></ProtectedRoute>} />
                <Route path="/recompensas" element={<ProtectedRoute><StudentOnly><StudentRecompensas /></StudentOnly></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><StudentOnly><StudentPerfil /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/comunidade" element={<ProtectedRoute><StudentOnly><StudentComunidade /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/evolucao" element={<ProtectedRoute><StudentOnly><StudentEvolucao /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/treino/:id" element={<ProtectedRoute><StudentOnly><StudentTreino /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/treino/:id/resultado" element={<ProtectedRoute><StudentOnly><StudentResultadoTreino /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/pedidos" element={<ProtectedRoute><StudentOnly><StudentMeusPedidos /></StudentOnly></ProtectedRoute>} />
                <Route path="/student/parceiros" element={<ProtectedRoute><StudentOnly><StudentParceiros /></StudentOnly></ProtectedRoute>} />

                {/* /admin/* — guarda-chuva consolidado (espelhando lemehub). */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <StaffOnly>
                        <AdminLayout />
                      </StaffOnly>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminHome />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="papel" element={<AdminRoleSwitcher />} />
                  <Route path="time" element={<AdminFilialEquipe />} />
                  <Route path="aulas" element={<AdminInstrutorAulas />} />
                  <Route path="coach" element={<AdminInstrutorAulas />} />
                  <Route path="chamada/:classId" element={<AdminInstrutorChamada />} />
                  <Route path="evolucao/:studentId" element={<AdminInstrutorEvolucao />} />
                  <Route path="tripulacoes" element={<AdminCoachCrew />} />
                  <Route path="alunos" element={<AdminAlunosLista />} />
                  <Route path="alunos/:id" element={<AdminAlunoDetalhe />} />
                  <Route path="financeiro" element={<AdminFilialFinanceiro />} />
                  <Route path="configuracoes" element={<AdminFilialConfig />} />
                  <Route path="mais" element={<AdminIndex />} />
                  <Route path="planos" element={<AdminPlanos />} />
                  <Route path="locais" element={<AdminLocais />} />
                  <Route path="canoas" element={<AdminCanoas />} />
                  <Route path="produtos" element={<AdminProdutos />} />
                  <Route path="pedidos-loja" element={<AdminPedidosLoja />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="avisos" element={<AdminAvisos />} />
                  <Route path="faturas" element={<AdminFaturas />} />
                  <Route path="treinos" element={<AdminTreinos />} />
                  <Route path="perfil" element={<AdminPerfil />} />
                  <Route path="usuarios" element={<AdminUsuarios />} />
                  <Route path="relatorios" element={<AdminRelatorios />} />
                  <Route path="parceiros" element={<AdminParceiros />} />
                  <Route path="biblioteca-treinos" element={<AdminBiblioteca />} />
                  <Route path="questionario-saude" element={<AdminQuestionario />} />
                  <Route path="equipes" element={<AdminEquipes />} />
                  <Route path="comunidade" element={<AdminComunidade />} />
                  <Route path="termos" element={<AdminTermos />} />
                  <Route path="ajuda" element={<AdminAjuda />} />
                </Route>

                {/* Redirects: /equipe/* -> /admin/* (compat com links antigos). */}
                <Route path="/equipe" element={<Navigate to="/admin" replace />} />
                <Route path="/equipe/papel" element={<Navigate to="/admin/papel" replace />} />
                <Route path="/equipe/time" element={<Navigate to="/admin/time" replace />} />
                <Route path="/equipe/aulas" element={<Navigate to="/admin/aulas" replace />} />
                <Route path="/equipe/chamada/:classId" element={<RedirectWithParams to="/admin/chamada/:classId" />} />
                <Route path="/equipe/evolucao/:studentId" element={<RedirectWithParams to="/admin/evolucao/:studentId" />} />
                <Route path="/equipe/crew" element={<Navigate to="/admin/tripulacoes" replace />} />
                <Route path="/equipe/financeiro" element={<Navigate to="/admin/financeiro" replace />} />
                <Route path="/equipe/alunos" element={<Navigate to="/admin/alunos" replace />} />
                <Route path="/equipe/alunos/:id" element={<RedirectWithParams to="/admin/alunos/:id" />} />
                <Route path="/equipe/config" element={<Navigate to="/admin/configuracoes" replace />} />

                {/* Redirects: nomes antigos dentro de /admin -> nomes novos. */}
                <Route path="/admin/pedidos" element={<Navigate to="/admin/pedidos-loja" replace />} />
                <Route path="/admin/biblioteca" element={<Navigate to="/admin/biblioteca-treinos" replace />} />
                <Route path="/admin/questionario" element={<Navigate to="/admin/questionario-saude" replace />} />

                {/* Super admin */}
                <Route path="/rede" element={<ProtectedRoute><SuperOnly><SuperFiliais /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/filial/:id" element={<ProtectedRoute><SuperOnly><SuperTenantDetalhe /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/financeiro" element={<ProtectedRoute><SuperOnly><SuperFinanceiro /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/contratos" element={<ProtectedRoute><SuperOnly><SuperContratos /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/planos" element={<ProtectedRoute><SuperOnly><SuperPlanosPlataforma /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/analytics" element={<ProtectedRoute><SuperOnly><SuperAnalytics /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/banners" element={<ProtectedRoute><SuperOnly><SuperBannersGlobais /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/parceiros" element={<ProtectedRoute><SuperOnly><SuperParceirosGlobais /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/config" element={<ProtectedRoute><SuperOnly><SuperConfig /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/push" element={<ProtectedRoute><SuperOnly><SuperPushStats /></SuperOnly></ProtectedRoute>} />
                <Route path="/rede/criar-filial" element={<ProtectedRoute><SuperOnly><SuperCriarTenant /></SuperOnly></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
