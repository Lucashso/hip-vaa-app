// useAdminBanners — banners + announcements do tenant.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminBanner {
  id: string;
  tenant_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface AdminAnnouncement {
  id: string;
  tenant_id: string | null;
  title: string;
  content: string;
  active: boolean;
  priority: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

export function useAdminBanners(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "banners", tenantId],
    queryFn: async (): Promise<{ banners: AdminBanner[]; announcements: AdminAnnouncement[] }> => {
      if (!tenantId) return { banners: [], announcements: [] };
      const [bannersRes, annRes] = await Promise.all([
        supabase
          .from("banners")
          .select("id, tenant_id, title, description, image_url, active, starts_at, ends_at")
          .eq("tenant_id", tenantId)
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("announcements")
          .select("id, tenant_id, title, content, active, priority, starts_at, ends_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false }),
      ]);
      if (bannersRes.error) throw bannersRes.error;
      if (annRes.error) throw annRes.error;
      return {
        banners: (bannersRes.data ?? []) as AdminBanner[],
        announcements: (annRes.data ?? []) as AdminAnnouncement[],
      };
    },
    enabled: !!tenantId,
  });
}
