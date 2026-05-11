// Admin index — grid de entry points pras 16 telas admin + 5 equipe extras.

import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";

interface AdminLink {
  to: string;
  icon: HVIconName;
  label: string;
  caption: string;
  color: string;
}

const SECTIONS: { title: string; items: AdminLink[] }[] = [
  {
    title: "Operação",
    items: [
      { to: "/equipe/alunos", icon: "users", label: "Alunos", caption: "Lista, ficha, ações", color: "#1B6FB0" },
      { to: "/equipe/time", icon: "user", label: "Equipe", caption: "Pessoas e papéis", color: "#2FB37A" },
      { to: "/equipe/crew", icon: "boat", label: "Tripulação OC6", caption: "Crew templates", color: "#25C7E5" },
      { to: "/admin/equipes", icon: "users", label: "Times", caption: "Equipes/turmas", color: "#FF6B4A" },
    ],
  },
  {
    title: "Catálogo & operação",
    items: [
      { to: "/admin/planos", icon: "wallet", label: "Planos", caption: "Mensalidades", color: "#0E3A5F" },
      { to: "/admin/locais", icon: "compass", label: "Locais", caption: "Venues do clube", color: "#1B6FB0" },
      { to: "/admin/canoas", icon: "boat", label: "Embarcações", caption: "Frota OC6/OC1", color: "#25C7E5" },
      { to: "/admin/produtos", icon: "shop", label: "Produtos", caption: "Loja Hip Va'a", color: "#7B2D9F" },
      { to: "/admin/pedidos", icon: "shop", label: "Pedidos", caption: "Vendas loja", color: "#F2B544" },
      { to: "/admin/biblioteca", icon: "dumbbell", label: "Biblioteca", caption: "Treinos & exercícios", color: "#FF6B4A" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { to: "/equipe/financeiro", icon: "wallet", label: "Cobrança", caption: "KPIs + inadimplentes", color: "#2FB37A" },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { to: "/admin/banners", icon: "star", label: "Banners & avisos", caption: "Campanhas", color: "#FF6B4A" },
      { to: "/admin/comunidade", icon: "users", label: "Comunidade", caption: "Moderação posts", color: "#1B6FB0" },
      { to: "/admin/parceiros", icon: "share", label: "Parceiros", caption: "Benefícios do clube", color: "#7B2D9F" },
    ],
  },
  {
    title: "Pessoas & papéis",
    items: [
      { to: "/admin/usuarios", icon: "user", label: "Usuários & papéis", caption: "Permissões", color: "#1B6FB0" },
      { to: "/admin/questionario", icon: "check", label: "Questionário saúde", caption: "Fluxo de matrícula", color: "#2FB37A" },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/admin/relatorios", icon: "trend", label: "Relatórios", caption: "KPIs, frequência, aniversários", color: "#25C7E5" },
    ],
  },
  {
    title: "Filial",
    items: [
      { to: "/equipe/config", icon: "settings", label: "Configurações", caption: "Identidade, regras, gateways", color: "#0E3A5F" },
      { to: "/admin/tema", icon: "star", label: "Tema & marca", caption: "Personalizar app", color: "#FF6B4A" },
      { to: "/admin/termos", icon: "credit", label: "Termos de uso", caption: "Versões", color: "#7B2D9F" },
      { to: "/admin/ajuda", icon: "share", label: "Ajuda & suporte", caption: "FAQ + WhatsApp", color: "#2FB37A" },
    ],
  },
];

export default function AdminIndex() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader title="Painel da filial" sub="ADMIN · TODAS AS FERRAMENTAS" />
      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <h3 className="hv-eyebrow mb-2">{sec.title}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {sec.items.map((it) => (
                <button
                  key={it.to}
                  type="button"
                  onClick={() => navigate(it.to)}
                  className="hv-card p-3.5 text-left hover:bg-hv-foam/30 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center mb-2.5"
                    style={{ background: `${it.color}1F`, color: it.color }}
                  >
                    <HVIcon name={it.icon} size={16} stroke={2.2} />
                  </div>
                  <div className="text-[13px] font-bold leading-tight">{it.label}</div>
                  <div className="text-[11px] text-hv-text-2 mt-0.5 leading-tight">{it.caption}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
