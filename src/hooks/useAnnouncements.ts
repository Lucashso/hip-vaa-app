// useAnnouncements — CRUD avisos/announcements do tenant + push.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

export const PRIORITY_OPTIONS: { value: AnnouncementPriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export interface Announcement {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  starts_at: string | null;
  ends_at: string | null;
}

export function useAnnouncements(tenantId?: string | null) {
  return useQuery({
    queryKey: ["announcements", tenantId],
    queryFn: async (): Promise<Announcement[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("announcements")
        .select("id, tenant_id, title, content, priority, active, starts_at, ends_at, created_at, created_by")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateAnnouncement(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      createdBy,
    }: {
      input: AnnouncementInput;
      createdBy: string | null;
    }): Promise<Announcement> => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          tenant_id: tenantId,
          title: input.title,
          content: input.content,
          priority: input.priority,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          active: true,
          created_by: createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Announcement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Aviso criado!");
    },
    onError: (err: Error) => toast.error("Erro ao criar aviso: " + err.message),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AnnouncementInput }) => {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: input.title,
          content: input.content,
          priority: input.priority,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Aviso atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar aviso: " + err.message),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success("Aviso excluído");
    },
    onError: (err: Error) => toast.error("Erro ao excluir: " + err.message),
  });
}

export function useToggleAnnouncementActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

export function useSendAnnouncementPush() {
  return useMutation({
    mutationFn: async ({
      tenantId,
      announcementId,
      title,
      body,
    }: {
      tenantId: string;
      announcementId: string;
      title: string;
      body: string;
    }) => {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          tenant_id: tenantId,
          title,
          body,
          type: "announcement",
          announcement_id: announcementId,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Push enviado!"),
    onError: (err: Error) => toast.error("Erro ao enviar push: " + err.message),
  });
}
