// ResetarSenha — destino do link de recuperação. Troca o code por sessão e atualiza senha.

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";
import { toast } from "sonner";

type SessionState = "checking" | "valid" | "invalid";

export default function ResetarSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // 1. Erro explícito no hash
        const hash = window.location.hash;
        if (hash.includes("error=") || hash.includes("error_code=")) {
          if (mounted) setSessionState("invalid");
          return;
        }

        // 2. PKCE — ?code= na URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            if (mounted) setSessionState("invalid");
            return;
          }
          window.history.replaceState({}, document.title, window.location.pathname);
          if (mounted) setSessionState("valid");
          return;
        }

        // 3. Sessão já existente (tokens no hash são tratados pelo supabase-js)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (mounted) setSessionState("valid");
          return;
        }

        // 4. Recovery via hash — espera o supabase-js processar
        if (hash.includes("access_token") || hash.includes("type=recovery")) {
          setTimeout(async () => {
            const { data: d2 } = await supabase.auth.getSession();
            if (mounted) setSessionState(d2.session ? "valid" : "invalid");
          }, 800);
          return;
        }

        if (mounted) setSessionState("invalid");
      } catch (err) {
        console.error("resetSenha init error:", err);
        if (mounted) setSessionState("invalid");
      }
    };

    run();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          if (mounted) setSessionState("valid");
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const fieldErrors: Record<string, string> = {};
    if (password.length < 6) {
      fieldErrors.password = "Mínimo 6 caracteres";
    }
    if (confirmPassword !== password) {
      fieldErrors.confirmPassword = "As senhas não coincidem";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha alterada com sucesso");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err) {
      console.error("updateUser error:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao redefinir senha",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const oceanBg =
    "linear-gradient(180deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 60%, hsl(var(--hv-blue)) 100%)";

  if (sessionState === "checking") {
    return (
      <div
        className="min-h-screen grid place-items-center text-white"
        style={{ background: oceanBg }}
      >
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (sessionState === "invalid") {
    return (
      <div
        className="relative min-h-screen overflow-hidden text-white"
        style={{ background: oceanBg }}
      >
        <div className="relative max-w-md mx-auto min-h-screen flex flex-col">
          <div className="px-7 pt-20 pb-6 text-center">
            <HVLogo size={64} color="white" className="mx-auto" />
            <div className="mt-5 font-mono text-[11px] tracking-[0.3em] text-white/70">
              LINK EXPIRADO
            </div>
            <h1 className="font-display text-[32px] leading-[1] mt-4 text-white">
              Link inválido
            </h1>
            <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[320px] mx-auto">
              O link de recuperação é inválido ou expirou. Solicite um novo para continuar.
            </p>
          </div>
          <div className="flex-1" />
          <div className="px-6 pb-12 space-y-3">
            <Link
              to="/esqueci-senha"
              className="w-full h-[54px] rounded-[18px] bg-hv-cyan text-hv-ink font-bold text-[15px] flex items-center justify-center gap-2"
            >
              Solicitar novo link
              <HVIcon name="arrow-right" size={16} />
            </Link>
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 mt-2 text-sm text-white/70 hover:text-white"
            >
              <HVIcon name="arrow-left" size={14} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: oceanBg }}
    >
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col">
        <div className="px-7 pt-20 pb-6 text-center">
          <HVLogo size={64} color="white" className="mx-auto" />
          <div className="mt-5 font-mono text-[11px] tracking-[0.3em] text-white/70">
            REDEFINIR SENHA
          </div>
          <h1 className="font-display text-[32px] leading-[1] mt-4 text-white">
            Nova senha
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[320px] mx-auto">
            Crie uma nova senha para acessar sua conta.
          </p>
        </div>

        <div className="flex-1" />

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
              SENHA
            </span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 py-2.5"
            />
          </div>
          {errors.password && (
            <div className="text-[12px] text-hv-coral pl-3">{errors.password}</div>
          )}

          <div
            className="flex items-center gap-2 rounded-[18px] p-1.5"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="px-3.5 py-2.5 text-[11px] tracking-[0.18em] font-mono text-white/60">
              CONFIRMAR
            </span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 py-2.5"
            />
          </div>
          {errors.confirmPassword && (
            <div className="text-[12px] text-hv-coral pl-3">{errors.confirmPassword}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[54px] rounded-[18px] bg-hv-cyan text-hv-ink font-bold text-[15px] mt-3 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Redefinir senha
                <HVIcon name="arrow-right" size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
