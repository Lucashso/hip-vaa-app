// AvulsoSucesso — confirmação pós-pagamento de drop-in.

import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";

export default function AvulsoSucesso() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
      <div className="w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-5">
        <HVIcon name="check" size={42} color="hsl(var(--hv-leaf))" stroke={2.4} />
      </div>
      <h1 className="font-display text-[28px] text-hv-navy">Reserva confirmada</h1>
      <p className="text-[14px] text-hv-text-2 mt-2 max-w-[320px]">
        Recebemos seu pagamento. Vá em sua filial no horário da aula e fale com o instrutor.
      </p>
      <button
        type="button"
        onClick={() => navigate("/auth", { replace: true })}
        className="mt-7 h-12 px-6 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center gap-2 active:scale-[0.97] transition-transform"
      >
        Veja com seu instrutor
        <HVIcon name="arrow-right" size={16} stroke={2.4} />
      </button>
    </div>
  );
}
