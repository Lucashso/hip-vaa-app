// CheckinRanking — top 5 da semana em check-ins (do mesmo tenant).
// Útil pra gamificação. Só monta se settings.checkin_ranking_enabled.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { getInitial } from "@/lib/utils";

interface RankingEntry {
  student_id: string;
  full_name: string;
  photo_url: string | null;
  count: number;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function useCheckinRanking(tenantId?: string | null) {
  return useQuery({
    queryKey: ["checkin-ranking-week", tenantId],
    queryFn: async (): Promise<RankingEntry[]> => {
      if (!tenantId) return [];
      const start = startOfWeek(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      // Busca checkins da semana do tenant + join com students/profiles.
      const { data, error } = await supabase
        .from("checkins")
        .select(
          "student_id, students(id, tenant_id, profile:profiles(full_name, photo_url))",
        )
        .gte("ts", start.toISOString())
        .lt("ts", end.toISOString());
      if (error) throw error;

      const counts = new Map<string, RankingEntry>();
      type RawRow = {
        student_id: string | null;
        students:
          | {
              tenant_id: string | null;
              profile:
                | { full_name: string | null; photo_url: string | null }
                | { full_name: string | null; photo_url: string | null }[]
                | null;
            }
          | {
              tenant_id: string | null;
              profile:
                | { full_name: string | null; photo_url: string | null }
                | { full_name: string | null; photo_url: string | null }[]
                | null;
            }[]
          | null;
      };
      for (const row of (data as unknown as RawRow[]) ?? []) {
        const sid = row.student_id;
        const sRaw = row.students;
        if (!sid || !sRaw) continue;
        const s = Array.isArray(sRaw) ? sRaw[0] : sRaw;
        if (!s || s.tenant_id !== tenantId) continue;
        const pRaw = s.profile;
        const profile = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw;
        const existing = counts.get(sid);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(sid, {
            student_id: sid,
            full_name: profile?.full_name || "Atleta",
            photo_url: profile?.photo_url ?? null,
            count: 1,
          });
        }
      }

      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: !!tenantId,
  });
}

export function CheckinRanking({ studentId }: { studentId?: string | null }) {
  const { profile } = useAuth();
  const { data: ranking = [], isLoading } = useCheckinRanking(profile?.tenant_id);

  if (isLoading) return null;
  if (ranking.length === 0) return null;

  return (
    <div className="hv-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <HVIcon name="trophy" size={18} color="hsl(var(--hv-amber))" stroke={2.2} />
        <div className="hv-eyebrow">RANKING DA SEMANA</div>
      </div>
      <div className="space-y-2">
        {ranking.map((r, i) => {
          const isMe = r.student_id === studentId;
          const medal = ["1º", "2º", "3º", "4º", "5º"][i];
          return (
            <div
              key={r.student_id}
              className={`flex items-center gap-3 py-1.5 px-2 rounded-[10px] ${
                isMe ? "bg-hv-foam" : ""
              }`}
            >
              <div className="hv-mono text-[12px] font-bold w-7 text-hv-navy">
                {medal}
              </div>
              {r.photo_url ? (
                <img
                  src={r.photo_url}
                  alt={r.full_name}
                  className="w-8 h-8 rounded-[10px] object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-[10px] bg-hv-navy text-white grid place-items-center font-bold text-[12px]">
                  {getInitial(r.full_name)}
                </div>
              )}
              <div className="flex-1 text-[13px] font-semibold truncate">
                {isMe ? "Você" : r.full_name.split(" ")[0]}
              </div>
              <div className="font-mono text-[12px] font-bold text-hv-text-2">
                {r.count}×
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
