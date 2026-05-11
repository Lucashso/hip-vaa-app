// Hooks de Super Admin — agregam dados de tenants, financeiro, contratos, planos,
// banners globais, parceiros globais e push notifications.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ───────────────────── Tenants ─────────────────────

export interface SuperTenantRow {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  is_test: boolean;
  created_at: string | null;
  students_count: number;
  contract: {
    royalty_percentage: number | null;
    royalty_fixed_cents: number | null;
    franchise_fee_cents: number | null;
    marketing_fee_percentage: number | null;
    status: string | null;
    starts_at: string | null;
    ends_at: string | null;
  } | null;
  subscription: {
    plan: string | null;
    status: string | null;
    price_cents: number | null;
  } | null;
}

export function useSuperTenants() {
  return useQuery({
    queryKey: ["super", "tenants"],
    queryFn: async (): Promise<SuperTenantRow[]> => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, slug, active, is_test, created_at")
        .order("created_at", { ascending: true });

      const list = (tenants || []).filter((t) => !t.is_test);
      const ids = list.map((t) => t.id);

      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("tenant_id")
          .in("tenant_id", ids);
        (students || []).forEach((s) => {
          counts[s.tenant_id] = (counts[s.tenant_id] || 0) + 1;
        });
      }

      const contracts: Record<string, SuperTenantRow["contract"]> = {};
      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from("franchise_contracts")
          .select(
            "tenant_id, royalty_percentage, royalty_fixed_cents, franchise_fee_cents, marketing_fee_percentage, status, starts_at, ends_at",
          )
          .in("tenant_id", ids);
        (rows || []).forEach((r) => {
          contracts[r.tenant_id] = r as SuperTenantRow["contract"];
        });
      }

      const subs: Record<string, SuperTenantRow["subscription"]> = {};
      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from("tenant_subscriptions")
          .select("tenant_id, plan, status, price_cents")
          .in("tenant_id", ids);
        (rows || []).forEach((r) => {
          subs[r.tenant_id] = {
            plan: r.plan,
            status: r.status,
            price_cents: r.price_cents,
          };
        });
      }

      return list.map((t) => ({
        ...t,
        students_count: counts[t.id] || 0,
        contract: contracts[t.id] || null,
        subscription: subs[t.id] || null,
      }));
    },
  });
}

// ───────────────────── Tenant Detalhe ─────────────────────

export interface SuperTenantDetalhe {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  created_at: string | null;
  students_count: number;
  active_students_count: number;
  mrr_cents: number;
  outstanding_cents: number;
  contract: SuperTenantRow["contract"];
  subscription: SuperTenantRow["subscription"];
  admins: { id: string; full_name: string; role: string | null }[];
}

export function useSuperTenantDetalhe(tenantId?: string) {
  return useQuery({
    queryKey: ["super", "tenant", tenantId],
    queryFn: async (): Promise<SuperTenantDetalhe | null> => {
      if (!tenantId) return null;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name, slug, active, created_at")
        .eq("id", tenantId)
        .maybeSingle();

      if (!tenant) return null;

      const { data: students } = await supabase
        .from("students")
        .select("id, status")
        .eq("tenant_id", tenantId);

      const totalStudents = students?.length ?? 0;
      const activeStudents = (students || []).filter((s) => s.status === "active").length;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount_cents, status, due_date")
        .eq("tenant_id", tenantId);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mrr = (invoices || [])
        .filter((i) => i.status === "paid" && i.due_date && new Date(i.due_date) >= monthStart)
        .reduce((s, i) => s + (i.amount_cents || 0), 0);
      const outstanding = (invoices || [])
        .filter((i) => i.status === "pending" || i.status === "overdue")
        .reduce((s, i) => s + (i.amount_cents || 0), 0);

      const { data: contract } = await supabase
        .from("franchise_contracts")
        .select(
          "royalty_percentage, royalty_fixed_cents, franchise_fee_cents, marketing_fee_percentage, status, starts_at, ends_at",
        )
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const { data: subscription } = await supabase
        .from("tenant_subscriptions")
        .select("plan, status, price_cents")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("tenant_id", tenantId);

      const adminUserIds = (roles || [])
        .filter((r) => ["owner", "manager", "finance", "coordinator"].includes(r.role as string))
        .map((r) => r.user_id);

      const admins: SuperTenantDetalhe["admins"] = [];
      if (adminUserIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", adminUserIds);
        const profMap: Record<string, string> = {};
        (profs || []).forEach((p) => {
          profMap[p.id] = p.full_name;
        });
        (roles || []).forEach((r) => {
          if (adminUserIds.includes(r.user_id)) {
            admins.push({
              id: r.user_id,
              full_name: profMap[r.user_id] || "—",
              role: r.role,
            });
          }
        });
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        active: tenant.active,
        created_at: tenant.created_at,
        students_count: totalStudents,
        active_students_count: activeStudents,
        mrr_cents: mrr,
        outstanding_cents: outstanding,
        contract: (contract as SuperTenantDetalhe["contract"]) ?? null,
        subscription: subscription ?? null,
        admins,
      };
    },
    enabled: !!tenantId,
  });
}

// ───────────────────── Financeiro ─────────────────────

export interface SuperFinanceiroData {
  confirmed_cents: number;
  pending_cents: number;
  pending_tenants_count: number;
  overdue_cents: number;
  overdue_tenants: {
    tenant_id: string;
    tenant_name: string;
    plan: string | null;
    days_overdue: number;
    amount_cents: number;
  }[];
  daily_flow: { day: number; in_cents: number; out_cents: number }[];
}

export function useSuperFinanceiro() {
  return useQuery({
    queryKey: ["super", "financeiro"],
    queryFn: async (): Promise<SuperFinanceiroData> => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, is_test")
        .eq("is_test", false);
      const tenantMap: Record<string, string> = {};
      (tenants || []).forEach((t) => {
        tenantMap[t.id] = t.name;
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: invoices } = await supabase
        .from("tenant_invoices")
        .select("tenant_id, amount_cents, due_date, status, paid_at")
        .gte("due_date", monthStart.toISOString().slice(0, 10))
        .lte("due_date", monthEnd.toISOString().slice(0, 10));

      const inv = invoices || [];

      const confirmed = inv
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + (i.amount_cents || 0), 0);

      const pendingRows = inv.filter((i) => i.status === "pending");
      const pending = pendingRows.reduce((s, i) => s + (i.amount_cents || 0), 0);
      const pendingTenants = new Set(pendingRows.map((i) => i.tenant_id)).size;

      const overdueRows = inv.filter((i) => i.status === "overdue");
      const overdue = overdueRows.reduce((s, i) => s + (i.amount_cents || 0), 0);

      const { data: subs } = await supabase
        .from("tenant_subscriptions")
        .select("tenant_id, plan");
      const planMap: Record<string, string> = {};
      (subs || []).forEach((s) => {
        if (s.plan) planMap[s.tenant_id] = s.plan;
      });

      const overdue_tenants = overdueRows.map((i) => {
        const days = i.due_date
          ? Math.max(
              0,
              Math.floor((now.getTime() - new Date(i.due_date).getTime()) / 86400000),
            )
          : 0;
        return {
          tenant_id: i.tenant_id,
          tenant_name: tenantMap[i.tenant_id] || "—",
          plan: planMap[i.tenant_id] ?? null,
          days_overdue: days,
          amount_cents: i.amount_cents || 0,
        };
      });

      // Fluxo diário do mês (entradas = paid_at no mês; saídas = pendentes vencidas/cancel)
      const daysInMonth = monthEnd.getDate();
      const daily_flow = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        in_cents: 0,
        out_cents: 0,
      }));
      inv.forEach((i) => {
        if (i.status === "paid" && i.paid_at) {
          const d = new Date(i.paid_at);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            daily_flow[d.getDate() - 1].in_cents += i.amount_cents || 0;
          }
        }
        if (i.status === "overdue" && i.due_date) {
          const d = new Date(i.due_date);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            daily_flow[d.getDate() - 1].out_cents += i.amount_cents || 0;
          }
        }
      });

      return {
        confirmed_cents: confirmed,
        pending_cents: pending,
        pending_tenants_count: pendingTenants,
        overdue_cents: overdue,
        overdue_tenants,
        daily_flow,
      };
    },
  });
}

// ───────────────────── Contratos ─────────────────────

export interface SuperContratoRow {
  id: string;
  tenant_id: string | null;
  tenant_name: string;
  kind: "franchise" | "service";
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  royalty_label: string;
  monthly_amount_cents: number | null;
}

export function useSuperContratos() {
  return useQuery({
    queryKey: ["super", "contratos"],
    queryFn: async (): Promise<SuperContratoRow[]> => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name");
      const tenantMap: Record<string, string> = {};
      (tenants || []).forEach((t) => {
        tenantMap[t.id] = t.name;
      });

      const { data: franchise } = await supabase
        .from("franchise_contracts")
        .select(
          "id, tenant_id, status, starts_at, ends_at, royalty_fixed_cents, royalty_percentage",
        );

      const { data: service } = await supabase
        .from("service_contracts")
        .select(
          "id, tenant_id, status, start_date, end_date, monthly_amount_cents, company_name",
        );

      const f: SuperContratoRow[] = (franchise || []).map((r) => {
        const pct = r.royalty_percentage != null ? `${r.royalty_percentage}%` : "";
        const fixed = r.royalty_fixed_cents
          ? `R$ ${Math.round((r.royalty_fixed_cents || 0) / 100)}`
          : "";
        const royalty = [fixed, pct].filter(Boolean).join(" + ") || "—";
        return {
          id: r.id,
          tenant_id: r.tenant_id,
          tenant_name: (r.tenant_id && tenantMap[r.tenant_id]) || "—",
          kind: "franchise",
          status: r.status,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
          royalty_label: royalty,
          monthly_amount_cents: r.royalty_fixed_cents ?? null,
        };
      });

      const s: SuperContratoRow[] = (service || []).map((r) => ({
        id: r.id,
        tenant_id: r.tenant_id,
        tenant_name:
          (r.tenant_id && tenantMap[r.tenant_id]) || r.company_name || "—",
        kind: "service",
        status: r.status,
        starts_at: r.start_date,
        ends_at: r.end_date,
        royalty_label: "—",
        monthly_amount_cents: r.monthly_amount_cents ?? null,
      }));

      return [...f, ...s];
    },
  });
}

// ───────────────────── Planos da plataforma ─────────────────────

export interface SuperPlatformPlan {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price_cents: number;
  features: string[];
  active: boolean;
  display_order: number;
  active_tenants: number;
}

export function useSuperPlanosPlataforma() {
  return useQuery({
    queryKey: ["super", "planos-plataforma"],
    queryFn: async (): Promise<SuperPlatformPlan[]> => {
      const { data: plans } = await supabase
        .from("platform_plans")
        .select("id, name, slug, description, price_cents, features, active, display_order")
        .order("display_order", { ascending: true });

      const { data: subs } = await supabase
        .from("tenant_subscriptions")
        .select("platform_plan_id, plan, status");

      const counts: Record<string, number> = {};
      const planSlugCounts: Record<string, number> = {};
      (subs || []).forEach((s) => {
        if (s.status === "active") {
          if (s.platform_plan_id) {
            counts[s.platform_plan_id] = (counts[s.platform_plan_id] || 0) + 1;
          }
          if (s.plan) {
            planSlugCounts[s.plan] = (planSlugCounts[s.plan] || 0) + 1;
          }
        }
      });

      return (plans || []).map((p) => {
        const fts = Array.isArray(p.features)
          ? (p.features as unknown[]).filter((x): x is string => typeof x === "string")
          : [];
        const activeTenants =
          counts[p.id] ?? (p.slug ? planSlugCounts[p.slug] ?? 0 : 0);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price_cents: p.price_cents,
          features: fts,
          active: p.active,
          display_order: p.display_order,
          active_tenants: activeTenants,
        };
      });
    },
  });
}

// ───────────────────── Banners globais ─────────────────────

export interface SuperBanner {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
}

export function useSuperBanners() {
  return useQuery({
    queryKey: ["super", "banners"],
    queryFn: async (): Promise<SuperBanner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select(
          "id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order",
        )
        .eq("is_global", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as SuperBanner[]) ?? [];
    },
  });
}

// ───────────────────── Parceiros globais ─────────────────────

export interface SuperPartner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  tenants_count: number;
  checkins_count: number;
}

export function useSuperParceiros() {
  return useQuery({
    queryKey: ["super", "parceiros"],
    queryFn: async (): Promise<SuperPartner[]> => {
      const { data: partners, error } = await supabase
        .from("partners")
        .select("id, name, description, logo_url, active")
        .eq("is_global", true)
        .order("display_order", { ascending: true });
      if (error) throw error;

      const ids = (partners || []).map((p) => p.id);

      const tenantCounts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from("partner_tenants")
          .select("partner_id, tenant_id")
          .in("partner_id", ids);
        const seen: Record<string, Set<string>> = {};
        (rows || []).forEach((r) => {
          if (!seen[r.partner_id]) seen[r.partner_id] = new Set();
          seen[r.partner_id].add(r.tenant_id);
        });
        Object.entries(seen).forEach(([pid, set]) => {
          tenantCounts[pid] = set.size;
        });
      }

      // partner_checkins não tem partner_id direto — agregamos via partner_students→partner_id
      const checkinCounts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: ps } = await supabase
          .from("partner_students")
          .select("id, partner_id")
          .in("partner_id", ids);
        const psMap: Record<string, string> = {};
        (ps || []).forEach((row) => {
          psMap[row.id] = row.partner_id;
        });
        const psIds = Object.keys(psMap);
        if (psIds.length > 0) {
          const { data: cks } = await supabase
            .from("partner_checkins")
            .select("partner_student_id")
            .in("partner_student_id", psIds);
          (cks || []).forEach((c) => {
            const pid = psMap[c.partner_student_id];
            if (pid) checkinCounts[pid] = (checkinCounts[pid] || 0) + 1;
          });
        }
      }

      return (partners || []).map((p) => ({
        ...p,
        tenants_count: tenantCounts[p.id] ?? 0,
        checkins_count: checkinCounts[p.id] ?? 0,
      })) as SuperPartner[];
    },
  });
}

// ───────────────────── Push stats ─────────────────────

export interface SuperPushStats {
  subscriptions_count: number;
  sent_month: number;
  delivered_month: number;
  failed_month: number;
  delivery_rate: number;
  click_rate: number;
  daily_sends: { day: number; count: number }[];
  recent_logs: {
    id: string;
    created_at: string | null;
    notification_type: string | null;
    title: string | null;
    status: string | null;
  }[];
}

export function useSuperPushStats() {
  return useQuery({
    queryKey: ["super", "push-stats"],
    queryFn: async (): Promise<SuperPushStats> => {
      const { count: subsCount } = await supabase
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: logs } = await supabase
        .from("push_notification_logs")
        .select("id, created_at, notification_type, title, status")
        .gte("created_at", monthStart.toISOString())
        .order("created_at", { ascending: false });

      const all = logs || [];
      const sent = all.length;
      const delivered = all.filter((l) => l.status === "sent" || l.status === "delivered").length;
      const failed = all.filter((l) => l.status === "failed").length;
      const clicked = all.filter((l) => l.status === "clicked").length;

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daily_sends = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        count: 0,
      }));
      all.forEach((l) => {
        if (l.created_at) {
          const d = new Date(l.created_at);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            daily_sends[d.getDate() - 1].count++;
          }
        }
      });

      return {
        subscriptions_count: subsCount ?? 0,
        sent_month: sent,
        delivered_month: delivered,
        failed_month: failed,
        delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
        click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
        daily_sends,
        recent_logs: all.slice(0, 20),
      };
    },
  });
}

// ───────────────────── Criar tenant: hooks ─────────────────────

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

/**
 * Debounced check de disponibilidade do slug (500ms).
 * Retorna o status atual; useEffect interno trata o debounce.
 */
export function useCheckSlugAvailable(slug: string): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>("idle");

  useEffect(() => {
    if (!slug) {
      setStatus("idle");
      return;
    }
    if (slug.length < 3) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", slug)
          .limit(1);
        if (cancelled) return;
        if (error) {
          setStatus("idle");
          return;
        }
        setStatus(data && data.length > 0 ? "taken" : "available");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  return status;
}

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price_cents: number;
  billing_type: string;
  features: string[];
  active: boolean;
  display_order: number | null;
}

export function usePlatformPlans(activeOnly = true) {
  return useQuery({
    queryKey: ["platform-plans", activeOnly],
    queryFn: async (): Promise<PlatformPlan[]> => {
      let q = supabase
        .from("platform_plans")
        .select(
          "id, name, slug, description, price_cents, billing_type, features, active, display_order",
        )
        .order("display_order", { ascending: true });
      if (activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        features: Array.isArray(p.features)
          ? (p.features as unknown[]).filter(
              (x): x is string => typeof x === "string",
            )
          : [],
      })) as PlatformPlan[];
    },
  });
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  business_template: string;
  feature_flags?: Record<string, boolean>;
  platform_plan_id: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword: string;
  document?: string;
  address?: string;
}

export interface CreateTenantResult {
  success: boolean;
  tenant_id?: string;
  owner_id?: string;
  error?: string;
}

export function useCreateTenantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateTenantPayload,
    ): Promise<CreateTenantResult> => {
      const response = await supabase.functions.invoke("create-tenant", {
        body: payload,
      });
      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar filial");
      }
      const data = response.data as CreateTenantResult;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super", "tenants"] });
      qc.invalidateQueries({ queryKey: ["super", "financeiro"] });
      toast.success("Filial criada com sucesso");
    },
    onError: (err: Error) => {
      console.error("createTenant error:", err);
      toast.error(err.message || "Erro ao criar filial");
    },
  });
}
