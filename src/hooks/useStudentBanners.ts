// useStudentBanners — banners ativos do tenant, filtrados por janela ativa e is_global.
// Para uso na Home do aluno (BannerCarousel).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface StudentBanner {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  display_order: number | null;
}

/**
 * Retorna banners ativos para o aluno do tenant atual:
 *  - active = true
 *  - tenant_id == tenantId OU is_global = true
 *  - starts_at <= now (ou null)
 *  - ends_at  >= now (ou null)
 */
export function useStudentBanners(tenantId?: string | null) {
  return useQuery({
    queryKey: ["student-banners", tenantId],
    queryFn: async (): Promise<StudentBanner[]> => {
      if (!tenantId) return [];
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("banners")
        .select(
          "id, tenant_id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order, is_global",
        )
        .eq("active", true)
        .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;

      return ((data ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        image_url: string | null;
        link_url: string | null;
        link_label: string | null;
        display_order: number | null;
        starts_at: string | null;
        ends_at: string | null;
      }>)
        .filter((b) => {
          if (b.starts_at && b.starts_at > nowIso) return false;
          if (b.ends_at && b.ends_at < nowIso) return false;
          return true;
        })
        .map((b) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          image_url: b.image_url,
          link_url: b.link_url,
          link_label: b.link_label,
          display_order: b.display_order,
        }));
    },
    enabled: !!tenantId,
  });
}
