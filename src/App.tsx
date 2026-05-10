import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/Loader";

import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";

const StudentHome = lazy(() => import("@/pages/student/Home"));
const StudentCheckin = lazy(() => import("@/pages/student/Checkin"));
const StudentCheckinPin = lazy(() => import("@/pages/student/CheckinPin"));
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
const StudentAvulso = lazy(() => import("@/pages/student/Avulso"));

const EquipeRoleSwitcher = lazy(() => import("@/pages/equipe/RoleSwitcher"));
const EquipeFilialHome = lazy(() => import("@/pages/equipe/FilialHome"));
const EquipeFilialEquipe = lazy(() => import("@/pages/equipe/FilialEquipe"));
const InstrutorAulas = lazy(() => import("@/pages/equipe/InstrutorAulas"));
const InstrutorChamada = lazy(() => import("@/pages/equipe/InstrutorChamada"));
const InstrutorEvolucao = lazy(() => import("@/pages/equipe/InstrutorEvolucao"));
const EquipeCoachCrew = lazy(() => import("@/pages/equipe/CoachCrew"));
const EquipeFilialFinanceiro = lazy(() => import("@/pages/equipe/FilialFinanceiro"));
const EquipeAlunosLista = lazy(() => import("@/pages/equipe/AlunosLista"));
const EquipeAlunoDetalhe = lazy(() => import("@/pages/equipe/AlunoDetalhe"));
const EquipeFilialConfig = lazy(() => import("@/pages/equipe/FilialConfig"));

const AdminPlanos = lazy(() => import("@/pages/admin/Planos"));
const AdminLocais = lazy(() => import("@/pages/admin/Locais"));
const AdminCanoas = lazy(() => import("@/pages/admin/Canoas"));
const AdminProdutos = lazy(() => import("@/pages/admin/Produtos"));
const AdminPedidosLoja = lazy(() => import("@/pages/admin/PedidosLoja"));
const AdminBanners = lazy(() => import("@/pages/admin/Banners"));
const AdminUsuarios = lazy(() => import("@/pages/admin/Usuarios"));
const AdminRelatorios = lazy(() => import("@/pages/admin/Relatorios"));
const AdminParceiros = lazy(() => import("@/pages/admin/Parceiros"));
const AdminTema = lazy(() => import("@/pages/admin/Tema"));
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
  if (!isStudent) return <Navigate to="/equipe" replace />;
  return <>{children}</>;
}

function StaffOnly({ children }: { children: React.ReactNode }) {
  const { isStaff, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAdmin) return <Navigate to="/equipe" replace />;
  return <>{children}</>;
}

function SuperOnly({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/bem-vindo" element={<Onboarding />} />
              <Route path="/tours/:tenantSlug/:tourSlug" element={<TourLanding />} />
              <Route path="/cadastro" element={<StudentCadastro />} />
              <Route path="/cadastro/:tenantSlug" element={<StudentCadastro />} />

              <Route path="/" element={<ProtectedRoute><StudentOnly><StudentHome /></StudentOnly></ProtectedRoute>} />
              <Route path="/checkin" element={<ProtectedRoute><StudentOnly><StudentCheckin /></StudentOnly></ProtectedRoute>} />
              <Route path="/checkin/pin" element={<ProtectedRoute><StudentOnly><StudentCheckinPin /></StudentOnly></ProtectedRoute>} />
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
              <Route path="/student/avulso" element={<ProtectedRoute><StudentOnly><StudentAvulso /></StudentOnly></ProtectedRoute>} />

              <Route path="/equipe" element={<ProtectedRoute><StaffOnly><EquipeFilialHome /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/papel" element={<ProtectedRoute><StaffOnly><EquipeRoleSwitcher /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/time" element={<ProtectedRoute><StaffOnly><EquipeFilialEquipe /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/aulas" element={<ProtectedRoute><StaffOnly><InstrutorAulas /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/chamada/:classId" element={<ProtectedRoute><StaffOnly><InstrutorChamada /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/evolucao/:studentId" element={<ProtectedRoute><StaffOnly><InstrutorEvolucao /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/crew" element={<ProtectedRoute><StaffOnly><EquipeCoachCrew /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/financeiro" element={<ProtectedRoute><StaffOnly><EquipeFilialFinanceiro /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/alunos" element={<ProtectedRoute><StaffOnly><EquipeAlunosLista /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/alunos/:id" element={<ProtectedRoute><StaffOnly><EquipeAlunoDetalhe /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/config" element={<ProtectedRoute><StaffOnly><EquipeFilialConfig /></StaffOnly></ProtectedRoute>} />

              <Route path="/admin/planos" element={<ProtectedRoute><AdminOnly><AdminPlanos /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/locais" element={<ProtectedRoute><AdminOnly><AdminLocais /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/canoas" element={<ProtectedRoute><AdminOnly><AdminCanoas /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/produtos" element={<ProtectedRoute><AdminOnly><AdminProdutos /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/pedidos" element={<ProtectedRoute><AdminOnly><AdminPedidosLoja /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/banners" element={<ProtectedRoute><AdminOnly><AdminBanners /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute><AdminOnly><AdminUsuarios /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/relatorios" element={<ProtectedRoute><AdminOnly><AdminRelatorios /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/parceiros" element={<ProtectedRoute><AdminOnly><AdminParceiros /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/tema" element={<ProtectedRoute><AdminOnly><AdminTema /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/biblioteca" element={<ProtectedRoute><AdminOnly><AdminBiblioteca /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/questionario" element={<ProtectedRoute><AdminOnly><AdminQuestionario /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/equipes" element={<ProtectedRoute><AdminOnly><AdminEquipes /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/comunidade" element={<ProtectedRoute><AdminOnly><AdminComunidade /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/termos" element={<ProtectedRoute><AdminOnly><AdminTermos /></AdminOnly></ProtectedRoute>} />
              <Route path="/admin/ajuda" element={<ProtectedRoute><AdminOnly><AdminAjuda /></AdminOnly></ProtectedRoute>} />

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
      </AuthProvider>
    </QueryClientProvider>
  );
}
