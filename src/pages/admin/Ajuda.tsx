// Admin · Ajuda & suporte — categorias FAQ + WhatsApp suporte.
// Baseado em admin-mobile.jsx HVAdminAjuda.

import { AdminHeader } from "@/components/AdminHeader";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import { useTenant } from "@/hooks/useTenant";

interface Category {
  l: string;
  icon: HVIconName;
  c: string;
}

const CATEGORIES: Category[] = [
  { l: "Primeiros passos", icon: "zap", c: "#25C7E5" },
  { l: "Financeiro", icon: "wallet", c: "#2FB37A" },
  { l: "Turmas", icon: "calendar", c: "#1B6FB0" },
  { l: "Alunos", icon: "users", c: "#FF6B4A" },
  { l: "Pagamentos", icon: "credit", c: "#F2B544" },
  { l: "Integrações", icon: "share", c: "#7B2D9F" },
];

const FAQS = [
  "Como criar fatura manual?",
  "Reabrir uma matrícula cancelada",
  "Negociar inadimplência com aluno",
  "Configurar chave Pix",
];

export default function AdminAjuda() {
  const { data: tenant } = useTenant();
  const whatsapp = tenant?.partnership_whatsapp || "";
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}`
    : "https://wa.me/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Ajuda & suporte" sub="LEME HUB · DOCS" />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.l}
              type="button"
              className="hv-card flex items-center gap-2.5 text-left"
              style={{ padding: 12 }}
            >
              <div
                className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0"
                style={{ background: `${c.c}1F`, color: c.c }}
              >
                <HVIcon name={c.icon} size={16} />
              </div>
              <span className="text-[12px] font-semibold truncate">{c.l}</span>
            </button>
          ))}
        </div>

        <h3
          className="text-[12px] uppercase font-bold text-hv-text-2 mt-4 mb-2"
          style={{ letterSpacing: "0.12em" }}
        >
          FAQ · financeiro
        </h3>
        <div className="hv-card overflow-hidden p-0">
          {FAQS.map((q, i, a) => (
            <div
              key={q}
              className="flex items-center gap-2.5"
              style={{
                padding: "12px 14px",
                borderBottom: i < a.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
              }}
            >
              <span className="flex-1 text-[13px] font-medium">{q}</span>
              <HVIcon name="chevron-down" size={16} color="hsl(var(--hv-text-3))" />
            </div>
          ))}
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 py-3.5 rounded-[14px] text-white font-bold text-[14px] border-0 flex justify-center items-center gap-2"
          style={{ background: "hsl(var(--hv-leaf))" }}
        >
          <HVIcon name="share" size={16} stroke={2.4} />
          Falar com suporte (WhatsApp)
        </a>
      </div>
    </div>
  );
}
