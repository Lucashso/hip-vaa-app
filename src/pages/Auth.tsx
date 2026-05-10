// Auth — fiel ao Hip.zip HVLoginScreen.
// Background gradient ocean + sun glow + ondas SVG + form glass-morphism.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, user, isLoading: authLoading, isStudent, isStaff, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || authLoading) return;
    if (isSuperAdmin) navigate("/rede");
    else if (isStaff) navigate("/equipe");
    else if (isStudent) navigate("/");
  }, [user, authLoading, isStudent, isStaff, isSuperAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid")
          ? "E-mail ou senha incorretos"
          : error.message,
      );
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
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 390 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="auth-glow" cx="50%" cy="20%">
            <stop offset="0%" stopColor="hsl(var(--hv-cyan))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--hv-cyan))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="195" cy="180" r="240" fill="url(#auth-glow)" />
        <path d="M-20 620 Q 80 590 195 620 T 410 620 L 410 820 L -20 820Z" fill="hsl(var(--hv-ink))" fillOpacity="0.6" />
        <path d="M-20 660 Q 80 630 195 660 T 410 660 L 410 820 L -20 820Z" fill="hsl(var(--hv-ink))" fillOpacity="0.85" />
      </svg>

      <div className="relative max-w-md mx-auto min-h-screen flex flex-col">
        <div className="px-7 pt-20 pb-6 text-center">
          <HVLogo size={84} color="white" className="mx-auto" />
          <div className="mt-5 font-mono text-[11px] tracking-[0.3em] text-white/70">
            BORA REMAR
          </div>
          <h1 className="font-display text-[38px] leading-[0.95] mt-4 text-white">
            O oceano
            <br />
            te chama.
          </h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-[280px] mx-auto">
            Treinos, passeios e conquistas do clube. Tudo na palma da sua mão.
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 py-2.5 tracking-[2px]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[54px] rounded-[18px] bg-hv-cyan text-hv-ink font-bold text-[15px] mt-3
                       flex items-center justify-center gap-2 transition-transform active:scale-[0.98]
                       disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Entrar e remar <HVIcon name="arrow-right" size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
