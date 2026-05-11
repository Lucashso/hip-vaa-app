// AdminNotificationBell — sininho com badge no AppHeader admin.
// Click abre NotificationSheet.

import { useState } from "react";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { NotificationSheet } from "./NotificationSheet";

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { total, byType } = useAdminNotifications(profile?.tenant_id ?? null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam transition-colors"
        aria-label={`Notificações${total > 0 ? ` (${total})` : ""}`}
      >
        <HVIcon name="bell" size={18} />
        {total > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold grid place-items-center text-white"
            style={{ background: "hsl(var(--hv-coral))" }}
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>
      <NotificationSheet
        open={open}
        onClose={() => setOpen(false)}
        byType={byType}
      />
    </>
  );
}

export default AdminNotificationBell;
