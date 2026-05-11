// Admin · Termos de uso — editor de contract_text e drop_in_contract_text.
// Preview markdown lado a lado (50/50): textarea + div renderizada.

import { useEffect, useState, type ReactNode } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { useTenant, useUpdateTenantContracts } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

type Tab = "mensalistas" | "avulsos";

// ── Markdown renderer simples (sem dep externa) ──────────────────────────────
// Suporta: # ## ### headers, **bold**, *italic*, listas - e *, links [text](url),
// parágrafos (linhas separadas por linha em branco).
function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let key = 0;

  function parseInline(line: string): ReactNode {
    // Bold + italic combinados ou separados
    const parts: ReactNode[] = [];
    let remaining = line;
    let pKey = 0;

    while (remaining.length > 0) {
      // Links: [text](url)
      const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/s);
      if (linkMatch) {
        if (linkMatch[1]) parts.push(<span key={pKey++}>{parseInline(linkMatch[1])}</span>);
        parts.push(
          <a key={pKey++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer"
            style={{ color: "hsl(var(--hv-blue))", textDecoration: "underline" }}>
            {linkMatch[2]}
          </a>,
        );
        remaining = linkMatch[4];
        continue;
      }
      // Bold: **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={pKey++}>{parseInline(boldMatch[1])}</span>);
        parts.push(<strong key={pKey++}>{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }
      // Italic: *text*
      const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/s);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={pKey++}>{parseInline(italicMatch[1])}</span>);
        parts.push(<em key={pKey++}>{italicMatch[2]}</em>);
        remaining = italicMatch[3];
        continue;
      }
      parts.push(<span key={pKey++}>{remaining}</span>);
      break;
    }
    return <>{parts}</>;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Heading 3
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} style={{ fontSize: 14, fontWeight: 700, margin: "10px 0 4px" }}>
          {parseInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    // Heading 2
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} style={{ fontSize: 16, fontWeight: 700, margin: "12px 0 5px" }}>
          {parseInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    // Heading 1
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} style={{ fontSize: 20, fontWeight: 800, margin: "14px 0 6px" }}>
          {parseInline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    // List item
    if (line.match(/^[-*] /)) {
      const listItems: ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(<li key={i}>{parseInline(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(
        <ul key={key++} style={{ margin: "6px 0 6px 16px", listStyleType: "disc" }}>
          {listItems}
        </ul>,
      );
      continue;
    }
    // Blank line → paragraph break
    if (line.trim() === "") {
      nodes.push(<div key={key++} style={{ height: 8 }} />);
      i++;
      continue;
    }
    // Normal paragraph line
    nodes.push(
      <p key={key++} style={{ margin: "2px 0", lineHeight: 1.55 }}>
        {parseInline(line)}
      </p>,
    );
    i++;
  }

  return <>{nodes}</>;
}

export default function AdminTermos() {
  const { data: tenant, isLoading } = useTenant();
  const updateContracts = useUpdateTenantContracts();
  const [tab, setTab] = useState<Tab>("mensalistas");
  const [contract, setContract] = useState("");
  const [dropIn, setDropIn] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (tenant) {
      setContract(tenant.contract_text || "");
      setDropIn(tenant.drop_in_contract_text || "");
    }
  }, [tenant]);

  const onSave = () => {
    if (tab === "mensalistas") {
      updateContracts.mutate({ contract_text: contract });
    } else {
      updateContracts.mutate({ drop_in_contract_text: dropIn });
    }
  };

  const currentText = tab === "mensalistas" ? contract : dropIn;
  const setCurrentText = tab === "mensalistas" ? setContract : setDropIn;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Termos de uso" sub="MENSALISTAS · AVULSOS" />
      <div className="flex items-center gap-4 px-4 pt-2.5 pb-1.5 bg-hv-surface border-b border-hv-line">
        {(["mensalistas", "avulsos"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "py-1.5 text-[13px] capitalize bg-transparent border-0",
              tab === t ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom:
                tab === t ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t === "mensalistas" ? "Mensalistas" : "Avulsos"}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-[8px] border-0"
          style={{
            background: showPreview ? "hsl(var(--hv-foam))" : "hsl(var(--hv-bg))",
            color: showPreview ? "hsl(var(--hv-navy))" : "hsl(var(--hv-text-3))",
          }}
        >
          {showPreview ? "Ocultar preview" : "Ver preview"}
        </button>
      </div>
      <div className="flex-1 overflow-auto pb-32 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : (
          <div className={cn("gap-4", showPreview ? "grid grid-cols-1 lg:grid-cols-2" : "block")}>
            {/* Editor */}
            <div className="hv-card p-3.5">
              <div
                className="hv-mono text-[10px] text-hv-text-3 font-bold mb-2"
                style={{ letterSpacing: "0.12em" }}
              >
                {tab === "mensalistas" ? "CONTRATO DE MENSALISTA" : "CONTRATO AULA AVULSA"} · EDITOR
              </div>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                rows={22}
                placeholder={`# Título do contrato\n\nTexto do contrato para ${tab === "mensalistas" ? "alunos mensalistas" : "alunos avulsos"}...\n\n## Cláusulas\n\n- Item 1\n- Item 2`}
                className="w-full p-3 rounded-[10px] text-[12px] text-hv-text font-mono"
                style={{
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              <div className="text-[11px] text-hv-text-3 mt-2">
                Markdown suportado: # headers, **bold**, *italic*, - listas, [link](url) · {currentText.length} caracteres
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="hv-card p-3.5">
                <div
                  className="hv-mono text-[10px] text-hv-text-3 font-bold mb-2"
                  style={{ letterSpacing: "0.12em" }}
                >
                  PREVIEW
                </div>
                <div
                  className="text-[13px] text-hv-text leading-relaxed"
                  style={{
                    minHeight: 300,
                    padding: "8px 4px",
                    borderRadius: 8,
                  }}
                >
                  {currentText.trim()
                    ? renderMarkdown(currentText)
                    : (
                      <span className="text-hv-text-3 italic">
                        O preview aparecerá aqui conforme você digita...
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="px-4 py-3 bg-hv-surface"
        style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={updateContracts.isPending || isLoading}
          className="w-full py-3.5 rounded-[14px] text-white font-bold text-[14px] border-0"
          style={{
            background: "hsl(var(--hv-navy))",
            opacity: updateContracts.isPending ? 0.6 : 1,
          }}
        >
          {updateContracts.isPending
            ? "Salvando..."
            : `Salvar termos · ${tab === "mensalistas" ? "Mensalistas" : "Avulsos"}`}
        </button>
      </div>
    </div>
  );
}
