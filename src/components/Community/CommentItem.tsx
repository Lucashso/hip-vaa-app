// CommentItem — linha de comentário: avatar + nome + texto + like-count + responder.

import { getInitial } from "@/lib/utils";
import type { CommunityComment } from "@/hooks/useCommunityMutations";

const COLORS = ["#FF6B4A", "#1B6FB0", "#2FB37A", "#7B2D9F", "#7A4A1F", "#25C7E5"];

interface CommentItemProps {
  comment: CommunityComment;
  index?: number;
  onReply?: (name: string) => void;
}

export function CommentItem({ comment, index = 0, onReply }: CommentItemProps) {
  const name = comment.author_name || "Atleta";
  const color = COLORS[index % COLORS.length];

  return (
    <div className="flex gap-2.5">
      {comment.author_photo_url ? (
        <img
          src={comment.author_photo_url}
          alt={name}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full grid place-items-center text-white font-display font-bold text-[12px] shrink-0"
          style={{ background: color }}
        >
          {getInitial(name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-foreground">{name}</div>
        <p className="text-[13px] text-foreground mt-0.5 leading-[1.45]">{comment.content}</p>
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(name)}
            className="text-[11px] text-hv-text-3 mt-1 hover:text-foreground transition-colors"
          >
            Responder
          </button>
        )}
      </div>
    </div>
  );
}
