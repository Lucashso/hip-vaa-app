// Frontend guards para uploads — rejeita arquivos óbvios antes de bater na rede.

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export interface ValidateImageOptions {
  /** Tamanho máximo em MB. Default 10. */
  maxSizeMB?: number;
  /** MIMEs permitidos. Default JPEG/PNG/WEBP. */
  mimes?: string[];
}

/** Sanitiza filename — strip de paths e chars inseguros. */
export function sanitizeFileName(name: string, maxLen = 64): string {
  if (!name) return "file";
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_");
  const trimmed = cleaned.replace(/^\.+/, "_").slice(0, maxLen);
  return trimmed || "file";
}

export function getFileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Valida imagem. Lança UploadValidationError em caso de erro. */
export function validateImage(file: File, opts: ValidateImageOptions = {}): void {
  const maxSizeMB = opts.maxSizeMB ?? 10;
  const mimes = opts.mimes ?? ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new UploadValidationError(`Arquivo muito grande (máx ${maxSizeMB}MB)`);
  }
  if (!file.type || !mimes.includes(file.type)) {
    throw new UploadValidationError("Formato não suportado (use JPG, PNG ou WEBP)");
  }
}
