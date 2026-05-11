// CadastroSucesso — mensagem final após pagamento confirmado.

import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";

export default function CadastroSucesso() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
      <div className="w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-5">
        <HVIcon name="check" size={42} color="hsl(var(--hv-leaf))" stroke={2.4} />
      </div>
      <h1 className="font-display text-[28px] text-hv-navy">Cadastro confirmado</h1>
      <p className="text-[14px] text-hv-text-2 mt-2 max-w-[320px]">
        Seu pagamento foi recebido. Agora é só fazer login e bora pra primeira aula.
      </p>
      <button
        type="button"
        onClick={() => navigate("/auth", { replace: true })}
        className="mt-7 h-12 px-6 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center gap-2 active:scale-[0.97] transition-transform"
      >
        Fazer login
        <HVIcon name="arrow-right" size={16} stroke={2.4} />
      </button>
    </div>
  );
}
