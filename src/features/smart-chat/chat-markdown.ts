export type ChatTextSegment =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'link'; value: string; href: string };

const TOKEN_PATTERN = /(\*\*[^*\n]+\*\*|https?:\/\/[^\s<>]+)/g;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

function linkHref(value: string): string {
  const trimmed = value.replace(TRAILING_PUNCTUATION, '');
  return /^https?:\/\//.test(trimmed) ? trimmed : '#';
}

export function parseChatText(text: string): ChatTextSegment[] {
  const segments: ChatTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ type: 'strong', value: token.slice(2, -2) });
    } else {
      const href = linkHref(token);
      if (href === '#') {
        segments.push({ type: 'text', value: token });
      } else {
        const suffix = token.slice(href.length);
        segments.push({ type: 'link', value: href, href });
        if (suffix) segments.push({ type: 'text', value: suffix });
      }
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
