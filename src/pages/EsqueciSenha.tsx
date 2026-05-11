// EsqueciSenha — formulário público para recuperação de senha.
// Chama edge `send-recovery-email` que dispara o link via SMTP.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";
import { toast } from "sonner";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) {
      toast.error("Digite um e-mail válido");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-recovery-email", {
        body: {
          email,
          redirectTo: `${window.location.origin}/resetar-senha`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error("send-recovery-email error:", err);
      toast.error("Não foi possível enviar o e-mail. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 60%, hsl(var(--hv-blue)) 100%)",
      }}
    >
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col">
        <div className="px-7 pt-20 pb-6 text-center">
          <HVLogo size={64} color="white" className="mx-auto" />
          <div className="mt-5 font-mono text-[11px] tracking-[0.3em] text-white/70">
            RECUPERAR ACESSO
          </div>
          <h1 className="font-display text-[32px] leading-[1] mt-4 text-white">
            {sent ? "E-mail enviado" : "Esqueceu a senha?"}
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[320px] mx-auto">
            {sent
              ? `Enviamos um link para ${email}. Verifique sua caixa de entrada e spam.`
              : "Digite seu e-mail e enviaremos um link para você redefinir a senha."}
          </p>
        </div>

        <div className="flex-1" />

        {sent ? (
          <div className="px-6 pb-12 space-y-3">
            <div
              className="rounded-[18px] p-5 text-center"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-12 h-12 mx-auto rounded-full grid place-items-center mb-3"
                style={{ background: "hsl(var(--hv-leaf))" }}
              >
                <HVIcon name="check" size={22} color="white" stroke={3} />
              </div>
              <div className="text-sm text-white/85">
                Se o e-mail estiver cadastrado, você receberá o link em instantes.
              </div>
            </div>
            <Link
              to="/auth"
              className="w-full h-[54px] rounded-[18px] bg-hv-cyan text-hv-ink font-bold text-[15px] mt-3 flex items-center justify-center gap-2"
            >
              <HVIcon name="arrow-left" size={16} />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-12 space-y-3">
            <div
              className="flex items-center gap-2 rounded-[18px] p-1.5"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="px-3.5 py-2.5 text-[11px] tracking-[0.18em] font-mono text-white/60">
                EMAIL
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isValidEmail}
              className="w-full h-[54px] rounded-[18px] bg-hv-cyan text-hv-ink font-bold text-[15px] mt-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Enviar link <HVIcon name="arrow-right" size={18} />
                </>
              )}
            </button>

            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 mt-4 text-sm text-white/70 hover:text-white"
            >
              <HVIcon name="arrow-left" size={14} />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
