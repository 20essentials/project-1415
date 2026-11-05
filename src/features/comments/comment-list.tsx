import type { PostComment } from "@/features/comments/comments";

export interface CommentListLabels {
  empty: string;
  anonymous: string;
}

interface CommentListProps {
  items: PostComment[];
  labels: CommentListLabels;
  locale: string;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0));
  return words.length > 0 ? letters.join("").toUpperCase() : "";
}

export function formatCommentDate(date: Date | null, locale: string): string {
  return date
    ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date)
    : "";
}

export function CommentList({ items, labels, locale }: CommentListProps) {
  if (items.length === 0) {
    return (
      <p data-testid="comments-empty" className="rounded-md border border-rule border-dashed bg-paper-warm/40 px-6 py-10 text-center text-sm text-ink-soft">
        {labels.empty}
      </p>
    );
  }

  // Comment bodies are plain-text blocks; never pass them as one HTML string.
  return (
    <ul className="flex flex-col divide-y divide-rule">
      {items.map((item) => {
        const paragraphs = item.text.split("\n").filter((line) => line.length > 0);
        const name = item.authorName || labels.anonymous;
        return (
          <li key={item.id} className="flex gap-4 py-6 first:pt-0">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-paper"
            >
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm font-medium text-ink">{name}</span>
                {item.createdDate && (
                  <span className="text-xs text-mute">
                    <time dateTime={item.createdDate.toISOString()}>
                      {formatCommentDate(item.createdDate, locale)}
                    </time>
                  </span>
                )}
              </p>
              {paragraphs.length > 0 ? (
                <div className="mt-2 flex flex-col gap-2 text-sm leading-6 text-ink-soft">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
