// SuperPageHeader — cabeçalho de página para as rotas /rede/*.
// Substitui o SuperShell antigo quando dentro do SuperAdminLayout (que já tem sidebar).

import type { ReactNode } from "react";

interface Props {
  sub: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SuperPageHeader({ sub, title, action, children }: Props) {
  return (
    <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 16,
        }}
      >
        <div>
          <div
            className="hv-mono"
            style={{
              fontSize: 11,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.4,
              fontWeight: 600,
            }}
          >
            {sub}
          </div>
          <h1
            className="font-display"
            style={{ fontSize: 30, marginTop: 2, fontWeight: 700 }}
          >
            {title}
          </h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
