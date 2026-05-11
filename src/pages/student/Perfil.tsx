// Perfil — hero gradient + conta + logout.

import { useNavigate } from "react-router-dom";
import { PageScaffold } from "@/components/PageScaffold";
import { useAuth } from "@/hooks/useAuth";
import { useMyStudent } from "@/hooks/useStudent";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { getInitial } from "@/lib/utils";

interface MenuItem {
  icon: HVIconName;
  label: string;
  caption?: string;
  onClick: () => void;
  destructive?: boolean;
}

export default function StudentPerfil() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: student } = useMyStudent();

  const statusLabel = (() => {
    switch (student?.status) {
      case "active":
        return "ATIVO";
      case "inactive":
        return "INATIVO";
      case "delinquent":
        return "INADIMPLENTE";
      default:
        return "PENDENTE";
    }
  })();

  const planLabel = student?.plan?.name || "Sem plano";

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const discover: MenuItem[] = [
    { icon: "trend", label: "Minha evolução", caption: "Frequência, km, treinos, avaliações", onClick: () => navigate("/student/evolucao") },
    { icon: "users", label: "Comunidade", caption: "Feed dos remadores do clube", onClick: () => navigate("/student/comunidade") },
    { icon: "gift", label: "Indicações", caption: "Convide amigos e ganhe créditos", onClick: () => navigate("/indicacoes") },
    { icon: "trophy", label: "Recompensas", caption: "Resgate seus créditos", onClick: () => navigate("/recompensas") },
    { icon: "share", label: "Parceiros do clube", caption: "Benefícios e descontos", onClick: () => navigate("/student/parceiros") },
    { icon: "shop", label: "Meus pedidos", caption: "Loja Hip Va'a", onClick: () => navigate("/student/pedidos") },
    { icon: "calendar", label: "Aula avulsa", caption: "Reservar drop-in sem matrícula", onClick: () => navigate("/student/avulso") },
  ];

  const items: MenuItem[] = [
    { icon: "user", label: "Dados pessoais", caption: "Nome, CPF, telefone, endereço", onClick: () => {} },
    { icon: "wallet", label: "Pagamentos", caption: "Plano, faturas, formas de pagamento", onClick: () => navigate("/plano") },
    { icon: "bell", label: "Notificações", caption: "WhatsApp, e-mail, push", onClick: () => {} },
    { icon: "logout", label: "Sair", caption: "Encerrar sessão neste dispositivo", onClick: handleLogout, destructive: true },
  ];

  return (
    <PageScaffold title="Perfil">
      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[24px] text-white p-6"
        style={{
          background:
            "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 60%, hsl(var(--hv-blue)) 100%)",
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 360 240"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <path
            d="M0 190 Q 90 165 180 190 T 360 190 L 360 240 L 0 240Z"
            fill="hsl(var(--hv-cyan) / 0.14)"
          />
          <path
            d="M0 210 Q 90 188 180 210 T 360 210 L 360 240 L 0 240Z"
            fill="hsl(var(--hv-cyan) / 0.22)"
          />
        </svg>

        <div className="relative flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full grid place-items-center font-display font-extrabold text-[40px] text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--hv-cyan)) 0%, hsl(var(--hv-coral)) 100%)",
            }}
          >
            {getInitial(profile?.full_name)}
          </div>
          <h2 className="font-display text-[26px] leading-tight mt-3 text-white">
            {profile?.full_name || "Atleta"}
          </h2>
          <div className="text-[12px] text-white/70 mt-1">
            {profile?.email || ""}
          </div>
          <div className="flex gap-2 mt-3">
            <span className="hv-chip bg-white/15 text-white">{statusLabel}</span>
            <span className="hv-chip bg-hv-cyan/20 text-hv-cyan">{planLabel}</span>
          </div>
        </div>
      </div>

      {/* Descobrir */}
      <div>
        <h3 className="hv-eyebrow mb-2">Descobrir</h3>
        <div className="space-y-2">
          {discover.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={it.onClick}
              className="hv-card w-full p-4 flex items-center gap-3 text-left hover:bg-hv-foam/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-[12px] grid place-items-center bg-hv-foam text-hv-navy">
                <HVIcon name={it.icon} size={18} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[14px]">{it.label}</div>
                {it.caption && <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">{it.caption}</div>}
              </div>
              <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
            </button>
          ))}
        </div>
      </div>

      {/* Conta */}
      <div>
        <h3 className="hv-eyebrow mb-2">Conta</h3>
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={it.onClick}
              className="hv-card w-full p-4 flex items-center gap-3 text-left hover:bg-hv-foam/40 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-[12px] grid place-items-center ${
                  it.destructive
                    ? "bg-hv-coral/12 text-hv-coral"
                    : "bg-hv-foam text-hv-navy"
                }`}
              >
                <HVIcon name={it.icon} size={18} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-display text-[14px] ${
                    it.destructive ? "text-hv-coral" : ""
                  }`}
                >
                  {it.label}
                </div>
                {it.caption && (
                  <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                    {it.caption}
                  </div>
                )}
              </div>
              <HVIcon
                name="chevron-right"
                size={18}
                color="hsl(var(--hv-text-3))"
              />
            </button>
          ))}
        </div>
      </div>
    </PageScaffold>
  );
}
