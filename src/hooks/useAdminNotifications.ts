// useAdminNotifications — agrega contagens de itens pendentes pro admin (sininho).
// Fontes: invoices vencidas, cadastros pendentes, pedidos loja, posts a moderar,
// drop-ins aguardando aprovação, passeios pendentes.
//
// Como hipvaa.invoices.status só tem (pending,paid,failed,canceled,refunded),
// "overdue" é derivado: status='pending' AND due_date < hoje.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminNotificationCounts {
  overdue_invoices: number;
  pending_signups: number;
  pending_orders: number;
  pending_posts: number;
  pending_dropins: number;
  pending_tours: number;
}

export interface AdminNotificationsResult {
  total: number;
  byType: AdminNotificationCounts;
  isLoading: boolean;
}

const STORAGE_PREFIX = "hv:notification-read:";

async function safeCount(
  table: string,
  build: (q: ReturnType<typeof supabase.from>) => unknown,
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base: any = supabase.from(table).select("id", { count: "exact", head: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = build(base);
    const { count, error } = await q;
    if (error) {
      console.warn(`[useAdminNotifications] erro contando ${table}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn(`[useAdminNotifications] exceção contando ${table}:`, err);
    return 0;
  }
}

export function useAdminNotifications(tenantId?: string | null): AdminNotificationsResult {
  const enabled = !!tenantId;
  const query = useQuery({
    queryKey: ["admin-notifications", tenantId],
    enabled,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AdminNotificationCounts> => {
      if (!tenantId) {
        return {
          overdue_invoices: 0,
          pending_signups: 0,
          pending_orders: 0,
          pending_posts: 0,
          pending_dropins: 0,
          pending_tours: 0,
        };
      }
      const today = new Date().toISOString().slice(0, 10);
      const [
        overdue_invoices,
        pending_signups,
        pending_orders,
        pending_posts,
        pending_dropins,
        pending_tours,
      ] = await Promise.all([
        // Faturas vencidas: pending + due_date < hoje
        safeCount("invoices", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("status", "pending").lt("due_date", today),
        ),
        // Cadastros pendentes
        safeCount("pending_signups", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("status", "pending"),
        ),
        // Pedidos da loja pendentes
        safeCount("product_orders", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("status", "pending"),
        ),
        // Posts da comunidade aguardando moderação
        safeCount("community_posts", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("is_approved", false),
        ),
        // Drop-ins aguardando aprovação
        safeCount("drop_in_students", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("booking_status", "pending"),
        ),
        // Passeios pendentes
        safeCount("tour_bookings", (q) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any).eq("tenant_id", tenantId).eq("status", "pending"),
        ),
      ]);

      return {
        overdue_invoices,
        pending_signups,
        pending_orders,
        pending_posts,
        pending_dropins,
        pending_tours,
      };
    },
  });

  const byType: AdminNotificationCounts = query.data ?? {
    overdue_invoices: 0,
    pending_signups: 0,
    pending_orders: 0,
    pending_posts: 0,
    pending_dropins: 0,
    pending_tours: 0,
  };

  const total =
    byType.overdue_invoices +
    byType.pending_signups +
    byType.pending_orders +
    byType.pending_posts +
    byType.pending_dropins +
    byType.pending_tours;

  return {
    total,
    byType,
    isLoading: query.isLoading,
  };
}

/**
 * Marcar tipo+id como "lido" localmente. Persistência simples via localStorage.
 * Não filtra a query (a contagem é puxada do banco), mas pode ser usado
 * pra esconder badge depois que o admin clicou.
 */
export function useMarkNotificationRead() {
  return {
    isRead(type: string, id: string): boolean {
      try {
        return localStorage.getItem(`${STORAGE_PREFIX}${type}:${id}`) === "1";
      } catch {
        return false;
      }
    },
    markRead(type: string, id: string) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${type}:${id}`, "1");
      } catch {
        // ignore
      }
    },
    clearRead(type: string, id: string) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${type}:${id}`);
      } catch {
        // ignore
      }
    },
  };
}
