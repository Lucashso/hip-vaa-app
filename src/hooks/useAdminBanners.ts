// useAdminBanners — banners + announcements do tenant (query + mutations).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AdminBanner {
  id: string;
  tenant_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number | null;
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

export interface BannerInput {
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
}

export function useAdminBanners(tenantId?: string | null) {
  return useQuery({
    queryKey: ["admin", "banners", tenantId],
    queryFn: async (): Promise<{ banners: AdminBanner[]; announcements: AdminAnnouncement[] }> => {
      if (!tenantId) return { banners: [], announcements: [] };
      const [bannersRes, annRes] = await Promise.all([
        supabase
          .from("banners")
          .select(
            "id, tenant_id, title, description, image_url, link_url, link_label, active, starts_at, ends_at, display_order",
          )
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

/** Upload de imagem para o bucket banners e retorna a public URL. */
export async function uploadBannerImage(
  tenantId: string,
  file: File,
): Promise<string> {
  const ext = "jpg";
  const path = `${tenantId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("banners")
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}

export function useCreateBanner(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      imageFile,
      createdBy,
    }: {
      input: BannerInput;
      imageFile: File | null;
      createdBy: string | null;
    }) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      let image_url = input.image_url;
      if (imageFile) {
        image_url = await uploadBannerImage(tenantId, imageFile);
      }
      const { error } = await supabase.from("banners").insert({
        tenant_id: tenantId,
        title: input.title,
        description: input.description,
        image_url,
        link_url: input.link_url,
        link_label: input.link_label,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        active: true,
        display_order: input.display_order,
        created_by: createdBy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Banner criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar banner: " + err.message),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenantId,
      input,
      imageFile,
    }: {
      id: string;
      tenantId: string | null;
      input: BannerInput;
      imageFile: File | null;
    }) => {
      let image_url = input.image_url;
      if (imageFile && tenantId) {
        image_url = await uploadBannerImage(tenantId, imageFile);
      }
      const { error } = await supabase
        .from("banners")
        .update({
          title: input.title,
          description: input.description,
          image_url,
          link_url: input.link_url,
          link_label: input.link_label,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          display_order: input.display_order,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Banner atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar banner: " + err.message),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Banner excluído");
    },
    onError: (err: Error) => toast.error("Erro ao excluir: " + err.message),
  });
}

export function useToggleBannerActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("banners").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}
