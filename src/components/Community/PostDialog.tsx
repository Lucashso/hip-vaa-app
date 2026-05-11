// PostDialog — dialog criar post (upload imagem com preview + caption).

import { useState, useRef } from "react";
import { HVIcon } from "@/lib/HVIcon";
import { validateImage } from "@/lib/uploadValidation";
import { toast } from "sonner";

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File, caption: string) => Promise<void>;
  busy: boolean;
}

export function PostDialog({ open, onClose, onSubmit, busy }: PostDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      validateImage(f, { maxSizeMB: 10 });
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    handleRemove();
    setCaption("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Selecione uma foto");
      return;
    }
    await onSubmit(file, caption);
    handleRemove();
    setCaption("");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 grid place-items-end"
      onClick={handleClose}
    >
      <div
        className="bg-background rounded-t-[24px] w-full max-w-md mx-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-hv-line shrink-0">
          <div className="font-display text-[18px]">Nova publicação</div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Inputs ocultos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Preview ou seletor */}
          {preview ? (
            <div className="relative rounded-[14px] overflow-hidden">
              <img src={preview} alt="preview" className="w-full max-h-[300px] object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 grid place-items-center text-white"
              >
                <HVIcon name="x" size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full aspect-square rounded-[14px] border-2 border-dashed border-hv-line bg-hv-foam/40 flex flex-col items-center justify-center gap-5">
              <div className="flex gap-8">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-hv-navy"
                >
                  <div className="w-14 h-14 rounded-[14px] bg-hv-foam grid place-items-center">
                    <HVIcon name="plus" size={26} stroke={2.2} />
                  </div>
                  <span className="text-[12px] font-semibold">Câmera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-hv-navy"
                >
                  <div className="w-14 h-14 rounded-[14px] bg-hv-foam grid place-items-center">
                    <HVIcon name="share" size={24} />
                  </div>
                  <span className="text-[12px] font-semibold">Galeria</span>
                </button>
              </div>
              <span className="text-[11px] text-hv-text-3">JPG, PNG ou WEBP até 10MB</span>
            </div>
          )}

          {preview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[12px] font-semibold text-hv-blue underline"
            >
              Trocar foto
            </button>
          )}

          {/* Caption */}
          <div>
            <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
              Legenda
            </label>
            <textarea
              className="mt-1.5 w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy min-h-[80px] resize-none"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Conta como foi o treino…"
              maxLength={500}
            />
            <div className="text-[11px] text-hv-text-3 text-right mt-1">
              {caption.length}/500
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-hv-line shrink-0">
          <button
            type="button"
            disabled={busy || !file}
            onClick={handleSubmit}
            className="w-full h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {busy ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
