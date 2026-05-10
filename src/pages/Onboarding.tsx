// Onboarding placeholder — pula direto pra /auth.
// Implementação completa fica pra próxima iteração se quiser swipe.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/auth", { replace: true });
  }, [navigate]);
  return null;
}
