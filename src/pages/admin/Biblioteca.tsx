// Admin · Biblioteca — lista de exercícios + play.
// Baseado em admin-mobile.jsx HVAdminBiblioteca.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { useAuth } from "@/hooks/useAuth";

const CAT_COLORS: Record<string, string> = {
  forca: "hsl(var(--hv-coral))",
  força: "hsl(var(--hv-coral))",
  cardio: "hsl(var(--hv-amber))",
  tecnica: "hsl(var(--hv-blue))",
  técnica: "hsl(var(--hv-blue))",
  mobilidade: "hsl(var(--hv-leaf))",
  default: "hsl(var(--hv-blue))",
};

function colorFor(type: string | null): string {
  if (!type) return CAT_COLORS.default;
  return CAT_COLORS[type.toLowerCase()] ?? CAT_COLORS.default;
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

export default function AdminBiblioteca() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: exercises = [], isLoading } = useExerciseLibrary(tenantId);
  const [cat, setCat] = useState<string>("all");

  const cats = useMemo(() => {
    const map: Record<string, number> = {};
    exercises.forEach((e) => {
      const t = e.exercise_type || e.muscle_group || "outros";
      map[t] = (map[t] || 0) + 1;
    });
    return map;
  }, [exercises]);

  const filtered = useMemo(() => {
    if (cat === "all") return exercises;
    return exercises.filter((e) => (e.exercise_type || e.muscle_group) === cat);
  }, [exercises, cat]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Biblioteca de treinos"
        sub={`${exercises.length} EXERCÍCIO${exercises.length === 1 ? "" : "S"}`}
        action={<PlusBtn />}
      />
      <Chips
        items={[
          { l: `Todos · ${exercises.length}`, on: cat === "all", onClick: () => setCat("all") },
          ...Object.entries(cats).map(([k, n]) => ({
            l: `${k} · ${n}`,
            on: cat === k,
            onClick: () => setCat(k),
          })),
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
            Nenhum exercício na biblioteca.
          </div>
        ) : (
          <div className="hv-card overflow-hidden p-0">
            {filtered.map((e, i, arr) => {
              const c = colorFor(e.exercise_type || e.muscle_group);
              const hasVideo = !!e.video_url;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-[10px] grid place-items-center text-white shrink-0"
                    style={{ background: c }}
                  >
                    <HVIcon name="dumbbell" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{e.name}</div>
                    {(e.exercise_type || e.muscle_group) && (
                      <span
                        className="hv-chip mt-1"
                        style={{
                          background: "hsl(var(--hv-bg))",
                          color: "hsl(var(--hv-text-2))",
                        }}
                      >
                        {e.exercise_type || e.muscle_group}
                      </span>
                    )}
                  </div>
                  {hasVideo && (
                    <button
                      type="button"
                      className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                      style={{
                        background: "hsl(var(--hv-foam))",
                        color: "hsl(var(--hv-navy))",
                      }}
                    >
                      <HVIcon name="play" size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
