// ConverterSucesso — mensagem final pós-conversão.
// Rotas: /converter/:token/sucesso e /:slug/converter/:token/sucesso

import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Button } from "@/components/Button";

export default function ConverterSucesso() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <div className="hv-card p-7 max-w-sm w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-4 animate-pulse-ring">
          <HVIcon name="check" size={42} stroke={2.6} color="hsl(var(--hv-leaf))" />
        </div>
        <div className="hv-eyebrow">MAHALO!</div>
        <h1 className="font-display text-[24px] mt-1 leading-tight">
          Cadastro concluído
        </h1>
        <p className="text-[13px] text-hv-text-2 mt-3 leading-[1.5]">
          Você agora é aluno mensalista. Enviamos um email com os detalhes do seu cadastro.
          Use seu email e a senha cadastrada para acessar o app.
        </p>
        <Button
          onClick={() => navigate("/auth")}
          variant="accent"
          size="lg"
          className="w-full mt-6"
        >
          Fazer login
          <HVIcon name="arrow-right" size={16} />
        </Button>
      </div>
    </div>
  );
}
