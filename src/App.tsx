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

const EquipeRoleSwitcher = lazy(() => import("@/pages/equipe/RoleSwitcher"));
const EquipeFilialHome = lazy(() => import("@/pages/equipe/FilialHome"));
const EquipeFilialEquipe = lazy(() => import("@/pages/equipe/FilialEquipe"));
const InstrutorAulas = lazy(() => import("@/pages/equipe/InstrutorAulas"));
const InstrutorChamada = lazy(() => import("@/pages/equipe/InstrutorChamada"));
const InstrutorEvolucao = lazy(() => import("@/pages/equipe/InstrutorEvolucao"));

const SuperFiliais = lazy(() => import("@/pages/super/Filiais"));
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

              <Route path="/equipe" element={<ProtectedRoute><StaffOnly><EquipeFilialHome /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/papel" element={<ProtectedRoute><StaffOnly><EquipeRoleSwitcher /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/time" element={<ProtectedRoute><StaffOnly><EquipeFilialEquipe /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/aulas" element={<ProtectedRoute><StaffOnly><InstrutorAulas /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/chamada/:classId" element={<ProtectedRoute><StaffOnly><InstrutorChamada /></StaffOnly></ProtectedRoute>} />
              <Route path="/equipe/evolucao/:studentId" element={<ProtectedRoute><StaffOnly><InstrutorEvolucao /></StaffOnly></ProtectedRoute>} />

              <Route path="/rede" element={<ProtectedRoute><SuperOnly><SuperFiliais /></SuperOnly></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
