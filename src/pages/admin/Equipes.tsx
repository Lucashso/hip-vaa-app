// Admin · Equipes / times — visual OC6 com 6 assentos.
// Baseado em admin-mobile.jsx HVAdminEquipes.

import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#1B6FB0", "#2FB37A", "#FF6B4A", "#7B2D9F", "#F2B544", "#25C7E5"];

interface CrewTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  boat_id: string | null;
  boat?: { id: string; name: string; capacity: number } | null;
  seats: { seat_position: number; student_id: string | null; staff_user_id: string | null }[];
}

function useCrewTemplates(tenantId: string | null) {
  return useQuery({
    queryKey: ["admin", "equipes", tenantId],
    queryFn: async (): Promise<CrewTemplate[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("crew_templates")
        .select(
          "id, tenant_id, name, description, boat_id, boat:boats(id, name, capacity), seats:crew_template_seats(seat_position, student_id, staff_user_id)",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CrewTemplate[];
    },
    enabled: !!tenantId,
  });
}

function PlusBtn({ label = "Novo" }: { label?: string }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
      style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
    >
      <HVIcon name="plus" size={14} stroke={2.6} />
      {label}
    </button>
  );
}

export default function AdminEquipes() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: teams = [], isLoading } = useCrewTemplates(tenantId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Equipes / times"
        sub={`${teams.length} TIMES`}
        action={<PlusBtn />}
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : teams.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum time cadastrado.
          </div>
        ) : (
          teams.map((t, i) => {
            const color = COLORS[i % COLORS.length];
            const cap = t.boat?.capacity ?? t.seats?.length ?? 6;
            const seatsArr = Array.from({ length: cap });
            const showSeats = i === 0; // expand only the first

            return (
              <div key={t.id} className="hv-card mb-2.5" style={{ padding: 14 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold truncate">{t.name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {(t.seats?.length ?? 0)} membros
                      {t.boat?.name ? ` · ${t.boat.name}` : ""}
                    </div>
                  </div>
                  <div
                    className="w-[38px] h-[38px] rounded-[12px] grid place-items-center text-white shrink-0"
                    style={{ background: color }}
                  >
                    <HVIcon name="users" size={18} />
                  </div>
                </div>
                {showSeats && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
                  >
                    <div
                      className="hv-mono text-[10px] text-hv-text-3 font-bold mb-2"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      ASSENTOS OC{cap}
                    </div>
                    <svg viewBox="0 0 320 60" className="w-full">
                      <path
                        d="M20 30 Q40 8 160 8 Q280 8 300 30 Q280 52 160 52 Q40 52 20 30Z"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                      />
                      {seatsArr.map((_, j) => (
                        <g key={j}>
                          <circle
                            cx={50 + j * (220 / Math.max(cap, 1))}
                            cy="30"
                            r="11"
                            fill={color}
                          />
                          <text
                            x={50 + j * (220 / Math.max(cap, 1))}
                            y="34"
                            textAnchor="middle"
                            fontSize="11"
                            fill="white"
                            fontWeight="700"
                          >
                            {j + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
