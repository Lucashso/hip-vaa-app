// AdminPerfil — placeholder para /admin/perfil.

import { useAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/components/AdminHeader";

export default function AdminPerfil() {
  const { profile, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader title="Perfil" sub="ADMIN · MINHA CONTA" back={false} />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="hv-card p-5">
          <div className="text-[11px] text-hv-text-3 font-mono tracking-wider uppercase">
            Conta
          </div>
          <div className="font-display text-[18px] font-bold text-hv-text-1 mt-1">
            {profile?.full_name || "Equipe"}
          </div>
          <div className="text-[12px] text-hv-text-2 mt-0.5">
            {profile?.email}
          </div>
          <div className="text-[11px] text-hv-text-3 mt-1">
            Papel: <b className="text-hv-text-2">{profile?.role}</b>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="hv-card w-full p-4 text-left text-hv-coral text-[13px] font-semibold"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
