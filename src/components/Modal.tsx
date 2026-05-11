// Modal — overlay simples + card centralizado (sem dependência shadcn).
// Usa fixed overlay + esc close.

import { useEffect, type ReactNode } from "react";
import { HVIcon } from "@/lib/HVIcon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(6, 24, 38, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-hv-surface w-full sm:rounded-[18px] rounded-t-[18px] max-h-[90vh] flex flex-col"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid hsl(var(--hv-line))" }}
        >
          <div className="flex-1 min-w-0">
            <div className="font-display text-[18px] font-extrabold truncate">{title}</div>
            {subtitle && (
              <div
                className="hv-mono text-[10px] text-hv-text-3 mt-0.5"
                style={{ letterSpacing: "0.1em" }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] grid place-items-center border-0 bg-transparent text-hv-text-2"
            aria-label="Fechar"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">{children}</div>
        {footer && (
          <div
            className="px-4 py-3 flex gap-2 justify-end"
            style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={380}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-[10px] text-[12px] font-semibold text-hv-text"
            style={{
              background: "hsl(var(--hv-bg))",
              border: "1px solid hsl(var(--hv-line))",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
            style={{
              background: destructive
                ? "hsl(var(--hv-coral))"
                : "hsl(var(--hv-navy))",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[13px] text-hv-text-2 leading-relaxed">{message}</p>
    </Modal>
  );
}
