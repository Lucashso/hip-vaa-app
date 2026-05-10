// Admin · Usuários & papéis — lista pessoas + chips de papel coloridos.
// Baseado em admin-mobile.jsx HVAdminUsuarios.

import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAdminUsuarios, type AdminUserRole } from "@/hooks/useAdminUsuarios";
import { useAuth } from "@/hooks/useAuth";

const ROLE_INFO: Record<AdminUserRole, { label: string; color: string }> = {
  owner: { label: "OWNER", color: "#0E3A5F" },
  manager: { label: "MANAGER", color: "#1B6FB0" },
  finance: { label: "FINANCE", color: "#2FB37A" },
  coach: { label: "COACH", color: "#25C7E5" },
  staff: { label: "STAFF", color: "#F2B544" },
  coordinator: { label: "COORD", color: "#FF6B4A" },
  student: { label: "ALUNO", color: "#7B2D9F" },
  superadmin: { label: "SUPER", color: "#061826" },
};

function PlusBtn({ label = "Convidar" }: { label?: string }) {
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

export default function AdminUsuarios() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: usuarios = [], isLoading } = useAdminUsuarios(tenantId);

  const uniqueRoles = new Set(usuarios.map((u) => u.role));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Usuários & papéis"
        sub={`${usuarios.length} PESSOAS · ${uniqueRoles.size} PAPÉIS`}
        action={<PlusBtn />}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-3">
        {isLoading ? (
          <Loader />
        ) : usuarios.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum usuário ainda.
          </div>
        ) : (
          <div className="hv-card overflow-hidden p-0">
            {usuarios.map((u, i, arr) => {
              const info = ROLE_INFO[u.role] ?? { label: u.role.toUpperCase(), color: "#7B2D9F" };
              const initial = (u.full_name?.[0] || "?").toUpperCase();
              return (
                <div
                  key={u.user_id}
                  className="flex items-center gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-bold relative shrink-0"
                    style={{ background: info.color, fontFamily: "var(--hv-font-display)" }}
                  >
                    {initial}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-[6px]"
                      style={{
                        background: u.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                        border: "2px solid hsl(var(--hv-surface))",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{u.full_name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {u.email || "—"}
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-extrabold rounded-[5px]"
                    style={{
                      padding: "3px 8px",
                      background: `${info.color}1F`,
                      color: info.color,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
