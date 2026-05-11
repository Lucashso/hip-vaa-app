// Validação, formatação e helpers de telefone brasileiro.

/** Valida telefone BR (fixo 10d ou celular 11d com 9). */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10 && cleaned.length !== 11) return false;

  const ddd = parseInt(cleaned.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  if (cleaned.length === 11 && cleaned.charAt(2) !== "9") return false;

  const numberPart = cleaned.substring(2);
  if (/^(\d)\1+$/.test(numberPart)) return false;

  return true;
}

/** Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX. */
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

/** Constrói URL do WhatsApp com DDI 55 default. */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${withCountry}${suffix}`;
}
