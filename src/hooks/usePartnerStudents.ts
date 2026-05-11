// usePartnerStudents — alunos vindos de parceiros (Wellhub/TotalPass/Decathlon).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type PartnerProvider = string; // enum: wellhub | totalpass | decathlon | etc.

export interface PartnerStudent {
  id: string;
  tenant_id: string;
  provider: PartnerProvider;
  external_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  plan_name: string | null;
  status: string | null;
  metadata_json: Record<string, unknown> | null;
  first_checkin_at: string | null;
  last_checkin_at: string | null;
  total_checkins: number | null;
  created_at: string | null;
}

interface UsePartnerStudentsOptions {
  provider?: PartnerProvider | "all";
  search?: string;
}

/** Lista de alunos parceiros do tenant, opcionalmente filtrando por provider/busca. */
export function usePartnerStudents(
  tenantId: string | undefined | null,
  opts: UsePartnerStudentsOptions = {},
) {
  const { provider = "all", search = "" } = opts;
  return useQuery({
    queryKey: ["partner-students", tenantId, provider, search],
    queryFn: async (): Promise<PartnerStudent[]> => {
      if (!tenantId) return [];
      let q = supabase
        .from("partner_students")
        .select(
          "id, tenant_id, provider, external_id, full_name, email, phone, document, " +
            "plan_name, status, metadata_json, first_checkin_at, last_checkin_at, " +
            "total_checkins, created_at",
        )
        .eq("tenant_id", tenantId)
        .order("last_checkin_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (provider && provider !== "all") q = q.eq("provider", provider);

      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as unknown as PartnerStudent[];

      if (search) {
        const term = search.toLowerCase();
        rows = rows.filter((s) => {
          const name = s.full_name?.toLowerCase() ?? "";
          const email = s.email?.toLowerCase() ?? "";
          const doc = (s.document ?? "").toLowerCase();
          return name.includes(term) || email.includes(term) || doc.includes(term);
        });
      }
      return rows;
    },
    enabled: !!tenantId,
  });
}

export interface PartnerCheckin {
  id: string;
  tenant_id: string;
  partner_student_id: string;
  provider: PartnerProvider;
  external_checkin_id: string | null;
  class_id: string | null;
  venue_id: string | null;
  checked_in_at: string;
  validated: boolean | null;
  validation_method: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string | null;
}

export interface PartnerStudentDetail {
  student: PartnerStudent;
  checkins: PartnerCheckin[];
}

/** Carrega detalhe de partner_student + histórico de checkins. */
export function usePartnerStudentDetails(id: string | undefined | null) {
  return useQuery({
    queryKey: ["partner-student-details", id],
    queryFn: async (): Promise<PartnerStudentDetail | null> => {
      if (!id) return null;
      const { data: student, error } = await supabase
        .from("partner_students")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (!student) return null;

      const { data: checkins } = await supabase
        .from("partner_checkins")
        .select("*")
        .eq("partner_student_id", id)
        .order("checked_in_at", { ascending: false })
        .limit(100);

      return {
        student: student as PartnerStudent,
        checkins: (checkins ?? []) as PartnerCheckin[],
      };
    },
    enabled: !!id,
  });
}
