// useAdminParceiros — parceiros + contagem de check-ins.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminParceiro {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  display_order: number | null;
  checkins_count: number;
  students_count: number;
}

export function useAdminParceiros(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "parceiros", tenantId],
    queryFn: async (): Promise<AdminParceiro[]> => {
      if (!tenantId) return [];

      const { data: partners, error } = await supabase
        .from("partners")
        .select("id, tenant_id, name, description, logo_url, active, display_order")
        .eq("tenant_id", tenantId)
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (error) throw error;

      const list = (partners ?? []) as Omit<AdminParceiro, "checkins_count" | "students_count">[];

      const counts: Record<string, { checkins: number; students: Set<string> }> = {};

      const { data: ckRows } = await supabase
        .from("partner_checkins")
        .select("partner_student_id, partner_student:partner_students(partner_id, student_id)")
        .eq("tenant_id", tenantId);

      type CkRow = {
        partner_student_id: string;
        partner_student: { partner_id: string; student_id: string } | null;
      };
      ((ckRows ?? []) as unknown as CkRow[]).forEach((r) => {
        const pid = r.partner_student?.partner_id;
        if (!pid) return;
        if (!counts[pid]) counts[pid] = { checkins: 0, students: new Set() };
        counts[pid].checkins += 1;
        if (r.partner_student?.student_id) counts[pid].students.add(r.partner_student.student_id);
      });

      return list.map((p) => ({
        ...p,
        checkins_count: counts[p.id]?.checkins ?? 0,
        students_count: counts[p.id]?.students.size ?? 0,
      }));
    },
    enabled: !!tenantId,
  });
}
