// Admin · Usuários & papéis — wiring real com user_roles + edges.
// Backend: useTeamMembers / useTeamStats / useCreateTeamMember / useToggleUserActive
//          / useUpdateUserRole / useDeleteUser.

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import {
  useTeamMembers,
  useTeamStats,
  useCreateTeamMember,
  useToggleUserActive,
  useUpdateUserRole,
  useDeleteUser,
  TEAM_ROLES,
  type TeamRole,
  type TeamMember,
} from "@/hooks/useTeam";

const ROLE_INFO: Record<TeamRole, { label: string; color: string }> = {
  owner: { label: "OWNER", color: "#0E3A5F" },
  manager: { label: "MANAGER", color: "#1B6FB0" },
  coordinator: { label: "COORD", color: "#FF6B4A" },
  finance: { label: "FINANCE", color: "#2FB37A" },
  coach: { label: "COACH", color: "#25C7E5" },
  staff: { label: "STAFF", color: "#F2B544" },
};

interface InviteForm {
  email: string;
  full_name: string;
  phone: string;
  role: TeamRole;
  password: string;
}

const INITIAL_INVITE: InviteForm = {
  email: "",
  full_name: "",
  phone: "",
  role: "staff",
  password: "",
};

function Backdrop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 24, 38, 0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 4,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid hsl(var(--hv-line))",
  background: "white",
  fontSize: 13,
  outline: "none",
} as const;

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: "hsl(var(--hv-text-2))",
  letterSpacing: 1.1,
} as const;

export default function AdminUsuarios() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;

  const [roleFilter, setRoleFilter] = useState<TeamRole | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>(INITIAL_INVITE);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<TeamRole>("staff");
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const { data: members = [], isLoading } = useTeamMembers(tenantId, roleFilter);
  const { data: stats } = useTeamStats(tenantId);
  const createMut = useCreateTeamMember();
  const toggleMut = useToggleUserActive();
  const updateRoleMut = useUpdateUserRole();
  const deleteMut = useDeleteUser();

  const uniqueRoleCount = useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats.by_role).filter((n) => n > 0).length;
  }, [stats]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (
      !inviteForm.email ||
      !inviteForm.full_name ||
      !inviteForm.phone ||
      !inviteForm.password ||
      inviteForm.password.length < 6
    ) {
      return;
    }
    await createMut.mutateAsync({
      tenant_id: tenantId,
      email: inviteForm.email.trim(),
      full_name: inviteForm.full_name.trim(),
      phone: inviteForm.phone.replace(/\D/g, ""),
      role: inviteForm.role,
      password: inviteForm.password,
    });
    if (!createMut.isError) {
      setShowInvite(false);
      setInviteForm(INITIAL_INVITE);
    }
  };

  const handleEditRoleSubmit = async () => {
    if (!editingMember || !tenantId) return;
    await updateRoleMut.mutateAsync({
      userId: editingMember.user_id,
      tenantId,
      newRole: editRole,
    });
    setEditingMember(null);
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    await deleteMut.mutateAsync(deletingMember.user_id);
    setDeletingMember(null);
  };

  const filterItems = [
    {
      l: `Todos${stats ? ` · ${stats.total}` : ""}`,
      on: roleFilter === null,
      onClick: () => setRoleFilter(null),
    },
    ...TEAM_ROLES.map((r) => ({
      l: `${ROLE_INFO[r].label}${stats ? ` · ${stats.by_role[r]}` : ""}`,
      on: roleFilter === r,
      onClick: () => setRoleFilter(r),
    })),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Usuários & papéis"
        sub={`${members.length} PESSOAS · ${uniqueRoleCount} PAPÉIS`}
        action={
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} />
            Convidar
          </button>
        }
      />
      <Chips items={filterItems} />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : members.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum usuário {roleFilter ? `com papel ${ROLE_INFO[roleFilter].label}` : "ainda"}.
          </div>
        ) : (
          <div className="hv-card overflow-hidden p-0">
            {members.map((u, i, arr) => {
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
                    className="text-[9px] font-extrabold rounded-[5px] cursor-pointer"
                    style={{
                      padding: "3px 8px",
                      background: `${info.color}1F`,
                      color: info.color,
                      letterSpacing: "0.06em",
                    }}
                    onClick={() => {
                      setEditingMember(u);
                      setEditRole(u.role);
                    }}
                  >
                    {info.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleMut.mutate({ userId: u.user_id, active: !u.active })}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{
                      background: u.active ? "hsl(var(--hv-foam))" : "hsl(var(--hv-bg))",
                      color: u.active ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-3))",
                    }}
                    title={u.active ? "Desativar" : "Reativar"}
                    disabled={toggleMut.isPending}
                  >
                    <HVIcon name={u.active ? "check" : "x"} size={14} stroke={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMember(u)}
                    className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                    style={{ background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-coral))" }}
                    title="Excluir"
                  >
                    <HVIcon name="x" size={14} stroke={2.4} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Convidar */}
      {showInvite && (
        <Backdrop onClick={() => !createMut.isPending && setShowInvite(false)}>
          <form
            onSubmit={handleInviteSubmit}
            className="hv-card"
            style={{ padding: 22 }}
          >
            <div className="hv-mono" style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}>
              CONVIDAR
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
                marginTop: 4,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              Novo membro da equipe
            </h3>

            <div style={{ marginBottom: 10 }}>
              <label className="hv-mono" style={labelStyle}>Nome completo</label>
              <input
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className="hv-mono" style={labelStyle}>E-mail</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label className="hv-mono" style={labelStyle}>Telefone</label>
                <input
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="11999999999"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="hv-mono" style={labelStyle}>Papel</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as TeamRole }))}
                  style={inputStyle}
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="hv-mono" style={labelStyle}>Senha inicial</label>
              <input
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={createMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-navy))",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {createMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Convidar
              </button>
            </div>
          </form>
        </Backdrop>
      )}

      {/* Dialog Editar papel */}
      {editingMember && (
        <Backdrop onClick={() => !updateRoleMut.isPending && setEditingMember(null)}>
          <div className="hv-card" style={{ padding: 22 }}>
            <div className="hv-mono" style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}>
              EDITAR PAPEL
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18,
                marginTop: 4,
                marginBottom: 14,
                fontWeight: 700,
              }}
            >
              {editingMember.full_name}
            </h3>
            <label className="hv-mono" style={labelStyle}>Papel</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as TeamRole)}
              style={inputStyle}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_INFO[r].label}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                disabled={updateRoleMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEditRoleSubmit}
                disabled={updateRoleMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-navy))",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {updateRoleMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* Dialog confirmação delete */}
      {deletingMember && (
        <Backdrop onClick={() => !deleteMut.isPending && setDeletingMember(null)}>
          <div className="hv-card" style={{ padding: 22 }}>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Excluir usuário?
            </h3>
            <div style={{ fontSize: 13, color: "hsl(var(--hv-text-2))", lineHeight: 1.5 }}>
              Tem certeza que deseja excluir <strong>{deletingMember.full_name}</strong>? Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={deleteMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-coral))",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {deleteMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}
