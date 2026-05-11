// CommentsSheet — sheet/dialog ancorado embaixo com lista de comentários + input.

import { useState, useRef, useEffect } from "react";
import { HVIcon } from "@/lib/HVIcon";
import { CommentItem } from "./CommentItem";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { usePostComments, useAddComment } from "@/hooks/useCommunityMutations";
import { toast } from "sonner";

interface CommentsSheetProps {
  postId: string;
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  profileId: string | undefined;
}

export function CommentsSheet({ postId, open, onClose, studentId, profileId }: CommentsSheetProps) {
  const { data: comments = [], isLoading } = usePostComments(open ? postId : undefined);
  const addComment = useAddComment();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setText("");
      setReplyTo(null);
    }
  }, [open]);

  const handleReply = (name: string) => {
    setReplyTo(name);
    setText(`@${name} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setText("");
  };

  const handleSend = async () => {
    if (!profileId) {
      toast.error("Faça login pra comentar");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({
        postId,
        content: trimmed,
        studentId,
        profileId,
      });
      setText("");
      setReplyTo(null);
    } catch {
      // toast já no hook
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      const newValue = text.slice(0, start) + emoji + text.slice(end);
      setText(newValue);
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-end">
      <div className="bg-background rounded-t-[24px] w-full max-w-md mx-auto h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-hv-line shrink-0">
          <div className="font-display text-[18px]">
            Comentários
            {comments.length > 0 && (
              <span className="ml-2 text-[13px] font-normal text-hv-text-3">
                ({comments.length})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-hv-foam"
          >
            <HVIcon name="x" size={18} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-hv-text-2 mt-4">Carregando…</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-hv-text-3 mt-8">
              Seja a primeira pessoa a comentar.
            </div>
          ) : (
            comments.map((c, i) => (
              <CommentItem
                key={c.id}
                comment={c}
                index={i}
                onReply={handleReply}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="mx-4 mb-1 flex items-center justify-between px-3 py-1.5 bg-hv-foam rounded-[8px]">
            <span className="text-[12px] text-hv-text-2">
              Respondendo a <span className="font-bold text-foreground">@{replyTo}</span>
            </span>
            <button
              type="button"
              onClick={cancelReply}
              className="w-5 h-5 grid place-items-center"
            >
              <HVIcon name="x" size={12} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-hv-line shrink-0">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              className="flex-1 px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={replyTo ? `Responder a @${replyTo}…` : "Escreva um comentário…"}
              maxLength={500}
            />
            <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
            <button
              type="button"
              disabled={addComment.isPending || !text.trim()}
              onClick={handleSend}
              className="px-4 h-[46px] rounded-[12px] bg-hv-navy text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
            >
              {addComment.isPending ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
