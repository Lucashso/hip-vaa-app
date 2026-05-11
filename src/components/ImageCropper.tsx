// ImageCropper — input file + preview + crop/resize via <canvas>.
// Sem lib externa. Props: aspectRatio (ex. 16/9 ou 1), maxWidth, onCropped(File).
// Comprime para JPEG quality 0.85, máx 500 KB.

import { useRef, useState, useCallback, type ChangeEvent } from "react";
import { HVIcon } from "@/lib/HVIcon";

interface ImageCropperProps {
  aspectRatio: number; // ex. 16/9 ou 1
  maxWidth: number;    // px do lado maior após resize
  onCropped: (file: File) => void;
  label?: string;
  previewUrl?: string | null; // URL existente (modo edição)
}

const MAX_BYTES = 500 * 1024; // 500 KB
const QUALITY = 0.85;

function cropAndResize(
  img: HTMLImageElement,
  aspectRatio: number,
  maxWidth: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Calcular crop centrado conforme aspect ratio
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const srcAspect = srcW / srcH;

    let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
    if (srcAspect > aspectRatio) {
      // imagem mais larga: cortar nas laterais
      cropW = srcH * aspectRatio;
      cropX = (srcW - cropW) / 2;
    } else if (srcAspect < aspectRatio) {
      // imagem mais alta: cortar em cima/baixo
      cropH = srcW / aspectRatio;
      cropY = (srcH - cropH) / 2;
    }

    // Calcular tamanho final
    let outW = Math.round(cropW);
    let outH = Math.round(cropH);
    if (outW > maxWidth) {
      outH = Math.round(maxWidth / aspectRatio);
      outW = maxWidth;
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("canvas context unavailable"));

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    // Tentar comprimir; se ainda acima de 500KB, reduz quality iterativamente
    let q = QUALITY;
    function tryExport() {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("canvas toBlob falhou"));
          if (blob.size <= MAX_BYTES || q <= 0.3) {
            resolve(blob);
          } else {
            q -= 0.1;
            tryExport();
          }
        },
        "image/jpeg",
        q,
      );
    }
    tryExport();
  });
}

export function ImageCropper({
  aspectRatio,
  maxWidth,
  onCropped,
  label = "Imagem",
  previewUrl,
}: ImageCropperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProcessing(true);
      try {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
          try {
            const blob = await cropAndResize(img, aspectRatio, maxWidth);
            const cropped = new File([blob], `cropped_${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const previewDataUrl = URL.createObjectURL(blob);
            setPreview(previewDataUrl);
            onCropped(cropped);
          } catch (err) {
            console.error("[ImageCropper] erro ao processar:", err);
          } finally {
            URL.revokeObjectURL(url);
            setProcessing(false);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          setProcessing(false);
        };
        img.src = url;
      } catch {
        setProcessing(false);
      }
      // Reset input pra permitir re-selecionar o mesmo arquivo
      e.target.value = "";
    },
    [aspectRatio, maxWidth, onCropped],
  );

  const ratio = aspectRatio >= 1 ? aspectRatio : 1 / aspectRatio;
  const paddingTop = aspectRatio >= 1
    ? `${(1 / aspectRatio) * 100}%`
    : `${aspectRatio * 100}%`;

  return (
    <div className="mb-2.5">
      <div className="text-[12px] font-semibold text-hv-text mb-1">{label}</div>
      <div
        className="relative w-full rounded-[10px] overflow-hidden cursor-pointer"
        style={{
          paddingTop,
          background: "hsl(var(--hv-bg))",
          border: "1px dashed hsl(var(--hv-line))",
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label={`Selecionar ${label}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {processing ? (
            <div className="text-[12px] text-hv-text-3">Processando...</div>
          ) : preview ? (
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <HVIcon name="image" size={28} className="text-hv-text-3 opacity-50" />
              <div className="text-[11px] text-hv-text-3">
                Clique para selecionar
              </div>
              <div className="text-[10px] text-hv-text-3 opacity-60">
                {aspectRatio >= 1
                  ? `${ratio.toFixed(0)}:1`
                  : `1:${(1 / ratio).toFixed(0)}`}{" "}
                · JPEG · max 500 KB
              </div>
            </>
          )}
        </div>

        {preview && !processing && (
          <button
            type="button"
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-[8px] grid place-items-center border-0 z-10"
            style={{ background: "rgba(6,24,38,0.65)" }}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            aria-label="Trocar imagem"
          >
            <HVIcon name="edit" size={14} className="text-white" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
