// NotificationSheet — drawer lateral com lista de notificações admin.
// Não usa Modal (que é centro); criamos sheet lateral inline com Tailwind.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HVIcon, type HVIconName } from "@/lib/HVIcon";
import type { AdminNotificationCounts } from "@/hooks/useAdminNotifications";

interface NotificationItem {
  key: keyof AdminNotificationCounts;
  count: number;
  title: string;
  description: string;
  icon: HVIconName;
  color: string;
  to: string | null; // null = não navega (rota não existe)
}

interface NotificationSheetProps {
  open: boolean;
  onClose: () => void;
  byType: AdminNotificationCounts;
}

export function NotificationSheet({ open, onClose, byType }: NotificationSheetProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const items: NotificationItem[] = [
    {
      key: "overdue_invoices",
      count: byType.overdue_invoices,
      title: "Faturas vencidas",
      description: "Alunos com mensalidade em atraso",
      icon: "wallet",
      color: "#FF6B4A",
      to: "/admin/faturas?filter=overdue",
    },
    {
      key: "pending_signups",
      count: byType.pending_signups,
      title: "Cadastros pendentes",
      description: "Novos alunos aguardando aprovação",
      icon: "user",
      color: "#1B6FB0",
      to: "/admin/alunos?filter=pending",
    },
    {
      key: "pending_orders",
      count: byType.pending_orders,
      title: "Pedidos da loja",
      description: "Pedidos aguardando processamento",
      icon: "shop",
      color: "#F2B544",
      to: "/admin/pedidos-loja?filter=pending",
    },
    {
      key: "pending_posts",
      count: byType.pending_posts,
      title: "Posts a aprovar",
      description: "Publicações da comunidade na fila",
      icon: "users",
      color: "#7B2D9F",
      to: "/admin/comunidade?filter=pending",
    },
    {
      key: "pending_dropins",
      count: byType.pending_dropins,
      title: "Drop-ins aguardando",
      description: "Aulas avulsas para confirmar",
      icon: "calendar",
      color: "#25C7E5",
      to: "/admin/alunos?tab=dropins",
    },
    {
      key: "pending_tours",
      count: byType.pending_tours,
      title: "Passeios pendentes",
      description: "Reservas de passeios para revisar",
      icon: "boat",
      color: "#2FB37A",
      to: null,
    },
  ];

  const visible = items.filter((it) => it.count > 0);

  function handleClick(to: string | null) {
    if (!to) return;
    onClose();
    navigate(to);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(6, 24, 38, 0.55)" }}
      onClick={onClose}
    >
      <div className="flex-1" />
      <aside
        className="bg-hv-surface w-full sm:max-w-md h-full flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid hsl(var(--hv-line))" }}
        >
          <div className="flex-1 min-w-0">
            <div className="font-display text-[18px] font-extrabold truncate">
              Notificações
            </div>
            <div
              className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
              style={{ letterSpacing: "0.1em" }}
            >
              ADMIN · PENDÊNCIAS
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] grid place-items-center border-0 bg-transparent text-hv-text-2 hover:bg-hv-foam"
            aria-label="Fechar"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
          {visible.length === 0 && (
            <div className="text-center py-12 text-hv-text-3">
              <div className="w-12 h-12 mx-auto mb-3 grid place-items-center opacity-50">
                <HVIcon name="bell" size={36} />
              </div>
              <div className="font-display text-[14px] font-bold text-hv-text-2">
                Tudo em dia!
              </div>
              <div className="text-[12px] mt-1">Nenhuma pendência</div>
            </div>
          )}
          {visible.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => handleClick(it.to)}
              disabled={!it.to}
              className="w-full hv-card p-3.5 flex items-center gap-3 text-left transition-colors hover:bg-hv-foam/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div
                className="w-10 h-10 rounded-[10px] grid place-items-center shrink-0"
                style={{ background: `${it.color}1F`, color: it.color }}
              >
                <HVIcon name={it.icon} size={20} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-display text-[14px] font-bold text-hv-text-1 truncate">
                    {it.title}
                  </div>
                  <span
                    className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-[6px]"
                    style={{ background: `${it.color}22`, color: it.color }}
                  >
                    {it.count}
                  </span>
                </div>
                <div className="text-[12px] text-hv-text-3 mt-0.5 truncate">
                  {it.description}
                </div>
              </div>
              {it.to && (
                <div className="text-hv-text-3 shrink-0">
                  <HVIcon name="chevron-right" size={16} />
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default NotificationSheet;
