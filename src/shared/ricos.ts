/**
 * SSR-friendly Ricos JSON to HTML renderer.
 *
 * Ricos is Wix's structured rich-text format. CMS rich-text fields (about-content
 * body, FAQ answer, etc.) are stored as a node tree, not HTML strings. The Wix
 * dashboard's rich-text editor reads and writes this format.
 *
 * Use this util on Astro SSR pages that need to render Ricos content as HTML
 * without pulling the full @wix/ricos React package (~80kb) into a static page.
 * The blog vertical uses @wix/ricos's RicosViewer React component because blog
 * posts can carry the full Ricos feature set (galleries, polls, embedded media).
 * CMS pages render a much narrower subset, so this walker covers about 80% of
 * what the dashboard editor produces:
 *
 *   - PARAGRAPH, HEADING (levels 1–6), BULLETED_LIST, ORDERED_LIST, LIST_ITEM
 *     (list items may hold PARAGRAPH children — editor shape — or plain TEXT
 *     children — CMS-stored shape)
 *   - BLOCKQUOTE, DIVIDER
 *   - TEXT decorations: BOLD, ITALIC, UNDERLINE, LINK
 *
 * Anything outside this set is rendered as a defensive `<p>` with the raw
 * `textData.text` (or empty string), so unknown nodes never throw — they
 * just render plainly. Add cases as the CMS surface grows.
 *
 * Usage:
 *   import { renderRicos } from "@/shared/ricos";
 *   ---
 *   const html = renderRicos(item.body);
 *   ---
 *   <div class="prose" set:html={html} />
 */

import { resolveWixImageUrl } from "@/shared/wix-image";

interface RicosLinkData {
  link?: { url?: string; target?: string; rel?: string };
}

type RicosTextDecoration =
  | { type: "BOLD" }
  | { type: "ITALIC" }
  | { type: "UNDERLINE" }
  | { type: "LINK"; linkData?: RicosLinkData }
  | { type: string; [key: string]: unknown };

function getLinkData(decoration: RicosTextDecoration): RicosLinkData | undefined {
  const raw = (decoration as { linkData?: unknown }).linkData;
  if (raw && typeof raw === "object" && "link" in raw) return raw as RicosLinkData;
  return undefined;
}

interface RicosTextData {
  text?: string;
  decorations?: RicosTextDecoration[];
}

interface RicosNode {
  type?: string;
  nodes?: RicosNode[];
  textData?: RicosTextData;
  headingData?: { level?: number };
  imageData?: RicosImageData;
  [key: string]: unknown;
}

interface RicosImageData {
  image?: { src?: { id?: string | null }; width?: number; height?: number };
  altText?: string;
}

export interface RicosDocument {
  nodes?: RicosNode[];
  [key: string]: unknown;
}

/**
 * Render a Ricos document (or a JSON-encoded Ricos string) as HTML.
 * Returns an empty string on null/undefined input — pages can `set:html=""`
 * without throwing.
 */
export function renderRicos(
  content: RicosDocument | string | null | undefined,
): string {
  if (!content) return "";

  const doc = typeof content === "string" ? safeParse(content) : content;
  if (!doc || !Array.isArray(doc.nodes)) return "";

  return doc.nodes.map(renderBlockNode).join("");
}

function safeParse(raw: string): RicosDocument | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as RicosDocument;
    return null;
  } catch {
    return null;
  }
}

function renderBlockNode(node: RicosNode): string {
  switch (node.type) {
    case "TEXT":
      // Some CMS-stored shapes hang the text directly off the list/block node
      // (no PARAGRAPH in between); a TEXT node has no children of its own.
      return `<p>${renderInlineNode(node)}</p>`;

    case "PARAGRAPH":
      return `<p>${renderInlineChildren(node)}</p>`;

    case "HEADING": {
      const level = clampHeadingLevel(node.headingData?.level);
      return `<h${level}>${renderInlineChildren(node)}</h${level}>`;
    }

    case "BULLETED_LIST":
      return `<ul>${(node.nodes ?? []).map(renderBlockNode).join("")}</ul>`;

    case "ORDERED_LIST":
      return `<ol>${(node.nodes ?? []).map(renderBlockNode).join("")}</ol>`;

    case "LIST_ITEM":
      return `<li>${(node.nodes ?? []).map(renderBlockNode).join("")}</li>`;

    case "BLOCKQUOTE":
      return `<blockquote>${(node.nodes ?? []).map(renderBlockNode).join("")}</blockquote>`;

    case "DIVIDER":
      return "<hr />";

    case "IMAGE": {
      const data = node.imageData as RicosImageData | undefined;
      const srcId = data?.image?.src?.id;
      if (!srcId) return "";
      const src = resolveWixImageUrl(srcId);
      if (!src) {
        console.warn("[ricos] unresolved IMAGE media id:", srcId);
        return "";
      }
      const width = data.image?.width;
      const height = data.image?.height;
      const alt = escapeAttr(data.altText ?? "");
      const dims = width && height ? ` width="${Math.floor(width)}" height="${Math.floor(height)}"` : "";
      return `<figure><img src="${escapeAttr(src)}" alt="${alt}"${dims} loading="lazy" decoding="async" /></figure>`;
    }

    default:
      return `<p>${renderInlineChildren(node)}</p>`;
  }
}

function renderInlineChildren(node: RicosNode): string {
  if (!Array.isArray(node.nodes)) return "";
  return node.nodes.map(renderInlineNode).join("");
}

function renderInlineNode(node: RicosNode): string {
  if (node.type !== "TEXT") {
    if (Array.isArray(node.nodes)) return renderInlineChildren(node);
    return "";
  }

  const text = escapeHtml(node.textData?.text ?? "");
  const decorations = node.textData?.decorations ?? [];

  let html = text;
  let linkOpen = "";
  let linkClose = "";

  for (const decoration of decorations) {
    switch (decoration.type) {
      case "BOLD":
        html = `<strong>${html}</strong>`;
        break;
      case "ITALIC":
        html = `<em>${html}</em>`;
        break;
      case "UNDERLINE":
        html = `<u>${html}</u>`;
        break;
      case "LINK": {
        const data = getLinkData(decoration);
        const url = data?.link?.url;
        if (url) {
          const target = data.link?.target;
          const rel = data.link?.rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
          linkOpen = `<a href="${escapeAttr(url)}"${target ? ` target="${escapeAttr(target)}"` : ""}${rel ? ` rel="${escapeAttr(rel)}"` : ""}>`;
          linkClose = "</a>";
        }
        break;
      }
      default:
        break;
    }
  }

  return `${linkOpen}${html}${linkClose}`;
}

function clampHeadingLevel(raw: number | undefined): 1 | 2 | 3 | 4 | 5 | 6 {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 2;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  if (n > 6) return 6;
  return n as 1 | 2 | 3 | 4 | 5 | 6;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
