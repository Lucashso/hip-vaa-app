// ErrorBoundary — captura erros não tratados em qualquer parte da árvore React
// e exibe um fallback oceânico amigável com ações de recuperação.

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message ?? "Erro desconhecido";
    const stack = this.state.error?.stack ?? "";
    const componentStack = this.state.errorInfo?.componentStack ?? "";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "hsl(210 20% 97%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "white",
            borderRadius: "14px",
            border: "1px solid hsl(210 16% 91%)",
            padding: "28px",
            boxShadow: "0 10px 30px hsl(209 75% 21% / 0.08)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "999px",
              background: "hsl(12 100% 64% / 0.12)",
              display: "grid",
              placeItems: "center",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle size={28} color="hsl(12 100% 64%)" />
          </div>

          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', Inter, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "hsl(210 53% 9%)",
              margin: "0 0 8px 0",
            }}
          >
            Algo deu errado
          </h1>

          <p
            style={{
              color: "hsl(210 18% 35%)",
              fontSize: "14px",
              lineHeight: 1.5,
              margin: "0 0 20px 0",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                background: "hsl(209 75% 21%)",
                color: "white",
              }}
            >
              <RefreshCw size={16} />
              Recarregar página
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                background: "transparent",
                color: "hsl(210 53% 9%)",
                border: "1px solid hsl(210 16% 91%)",
              }}
            >
              <Home size={16} />
              Voltar ao início
            </button>
          </div>

          {import.meta.env.DEV && (stack || componentStack) && (
            <details
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid hsl(210 16% 91%)",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "hsl(210 13% 58%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Detalhes técnicos
              </summary>
              <pre
                style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  lineHeight: 1.5,
                  color: "hsl(210 18% 35%)",
                  background: "hsl(210 20% 97%)",
                  padding: "12px",
                  borderRadius: "8px",
                  overflow: "auto",
                  maxHeight: "240px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                }}
              >
                {stack}
                {componentStack && "\n\n--- Component Stack ---" + componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
