// Privacidade — política pública de privacidade (LGPD).
// Rotas: /privacidade e /privacy.

import { Link } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Quem somos",
    body: [
      "O Hip Va'a é um aplicativo de gestão de filiais de canoa havaiana operado pela Leme Hub Tecnologia Ltda., responsável pelo tratamento dos seus dados pessoais (controladora) em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).",
    ],
  },
  {
    title: "2. Quais dados coletamos",
    body: [
      "Coletamos: dados cadastrais (nome, CPF, e-mail, telefone, endereço, data de nascimento), dados de pagamento processados via Asaas, dados de saúde declarados em questionário pré-prática, fotos e vídeos enviados, dados de uso do app (acesso, check-ins, treinos, pedidos) e dados de localização aproximada quando autorizado.",
    ],
  },
  {
    title: "3. Como usamos seus dados",
    body: [
      "Usamos seus dados para: prestar os serviços contratados (aulas, treinos, passeios, lojas internas), processar pagamentos, emitir notas fiscais, enviar comunicações relacionadas a aulas e cobranças, gerar relatórios anonimizados para a franquia, manter a segurança da plataforma e cumprir obrigações legais e fiscais.",
    ],
  },
  {
    title: "4. Com quem compartilhamos",
    body: [
      "Compartilhamos dados estritamente necessários com: processadores de pagamento (Asaas), serviços de envio de e-mail e WhatsApp, prefeituras (NFS-e), franqueador (Hip Va'a Brasil) para fins de royalties e auditoria contratual, e autoridades públicas quando exigido por lei.",
    ],
  },
  {
    title: "5. Seus direitos como titular",
    body: [
      "Você pode, a qualquer momento: confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou desatualizados, solicitar anonimização ou eliminação de dados desnecessários, revogar consentimentos e portar seus dados para outro fornecedor.",
      "Para exercer seus direitos, entre em contato pelo e-mail privacidade@lemehub.com.br.",
    ],
  },
  {
    title: "6. Retenção e segurança",
    body: [
      "Seus dados são armazenados em servidores no Brasil (Supabase São Paulo) com criptografia em trânsito e em repouso. Mantemos os dados pelo prazo necessário para cumprir as finalidades acima e respeitar prazos legais (em especial, prazos fiscais e tributários de até 5 anos).",
    ],
  },
  {
    title: "7. Cookies e tecnologias similares",
    body: [
      "Usamos cookies essenciais para autenticação e funcionamento da plataforma. Não usamos cookies publicitários nem compartilhamos seus hábitos de navegação com terceiros para fins de marketing direcionado.",
    ],
  },
  {
    title: "8. Alterações nesta política",
    body: [
      "Esta política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas via e-mail e dentro do app. A data da última atualização aparece no topo desta página.",
    ],
  },
  {
    title: "9. Contato e DPO",
    body: [
      "Dúvidas, pedidos e reclamações relacionados ao tratamento dos seus dados pessoais devem ser direcionados ao nosso Encarregado de Proteção de Dados (DPO):",
      "dpo@lemehub.com.br",
      "Em caso de não resolução, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD) em www.gov.br/anpd.",
    ],
  },
];

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header
        className="text-white"
        style={{ background: "linear-gradient(135deg, #061826, #0E3A5F)" }}
      >
        <div className="max-w-2xl mx-auto px-5 py-8 flex items-start gap-4">
          <Link
            to="/auth"
            className="w-9 h-9 rounded-[12px] grid place-items-center border-0 text-white"
            style={{ background: "rgba(255,255,255,0.12)" }}
            aria-label="Voltar"
          >
            <HVIcon name="chevron-left" size={18} />
          </Link>
          <div className="flex-1">
            <div className="hv-mono text-[10px] tracking-[0.2em] text-white/70">
              POLÍTICA · LGPD
            </div>
            <h1
              className="text-white mt-1"
              style={{
                fontFamily: "var(--hv-font-display, 'Bricolage Grotesque')",
                fontSize: 28,
              }}
            >
              Privacidade
            </h1>
            <div className="hv-mono text-[11px] text-white/60 mt-2">
              Atualizado em 11 de maio de 2026
            </div>
          </div>
          <HVLogo size={40} color="white" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-7">
        <div className="hv-card p-6">
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "hsl(var(--hv-text-2))",
              marginBottom: 6,
            }}
          >
            Esta política descreve como o Hip Va'a coleta, usa, armazena e compartilha
            dados pessoais dos seus usuários, em conformidade com a LGPD.
          </p>

          {SECTIONS.map((sec) => (
            <section key={sec.title} style={{ marginTop: 22 }}>
              <h2
                style={{
                  fontFamily: "var(--hv-font-display, 'Bricolage Grotesque')",
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "hsl(var(--hv-text))",
                }}
              >
                {sec.title}
              </h2>
              {sec.body.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "hsl(var(--hv-text-2))",
                    marginBottom: 8,
                  }}
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div
          className="mt-5 text-center text-[12px]"
          style={{ color: "hsl(var(--hv-text-3))" }}
        >
          Em caso de dúvidas, escreva para{" "}
          <a
            href="mailto:privacidade@lemehub.com.br"
            className="font-medium"
            style={{ color: "hsl(var(--hv-blue))" }}
          >
            privacidade@lemehub.com.br
          </a>
          .
        </div>
      </main>
    </div>
  );
}
