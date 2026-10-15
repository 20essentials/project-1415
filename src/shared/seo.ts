const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function normalize(input: string): string {
  return decodeEntities(input).replace(/\s+/g, ' ').trim();
}

export function toMetaDescription(
  html: string | null | undefined,
  fallback: string,
  maxLength = 155,
): string {
  const text = normalize((html ?? '').replace(/<[^>]*>/g, ' '));
  const value = text || normalize(fallback);
  if (value.length <= maxLength) return value;

  const clipped = value.slice(0, maxLength - 1);
  const boundary = clipped.lastIndexOf(' ');
  const cut = boundary > Math.floor(maxLength * 0.6) ? clipped.slice(0, boundary) : clipped;
  return `${cut.trimEnd()}…`;
}
