/**
 * SSR-friendly Ricos JSON to HTML renderer.
 *
 * Ricos is Wix's structured rich-text format. CMS rich-text fields and Blog
 * posts are stored as a node tree, not HTML strings. This walker covers the
 * full plugin set available to editors (shapes verified against the official
 * mono recipe wix-manage/references/rich-content/author-ricos-rich-content.md
 * and the Content_V3 schema):
 *
 *   - PARAGRAPH (incl. empty spacer paragraphs), HEADING (levels 1–6),
 *     BULLETED_LIST / ORDERED_LIST / LIST_ITEM, BLOCKQUOTE, DIVIDER
 *   - IMAGE (with optional CAPTION child), GALLERY, VIDEO, AUDIO
 *   - TABLE (+TABLE_ROW/TABLE_CELL, row/column headers, col widths)
 *   - CODE_BLOCK, COLLAPSIBLE_LIST, BUTTON (LINK), HTML embed
 *   - TEXT decorations: BOLD, ITALIC, UNDERLINE, STRIKETHROUGH, LINK,
 *     COLOR, FONT_SIZE, SPOILER
 *
 * Anything outside this set is rendered as a defensive `<p>` with the raw
 * text inline children, so unknown nodes never throw. Styled by
 * src/shared/ricos.css (paired classes: ricos-*).
 *
 * Usage:
 *   import { renderRicos } from "@/shared/ricos";
 *   const html = renderRicos(item.body);   // <div set:html={html} />
 */

import { resolveWixImageUrl } from "@/shared/wix-image";

interface RicosLinkTarget {
  url?: string;
  target?: string;
  nofollow?: boolean;
  sponsored?: boolean;
  ugc?: boolean;
}

type RicosTextDecoration =
  | { type: "BOLD" }
  | { type: "ITALIC" }
  | { type: "UNDERLINE" }
  | { type: "STRIKETHROUGH" }
  | { type: "SPOILER" }
  | { type: "COLOR"; colorData?: { foreground?: string; background?: string } }
  | { type: "FONT_SIZE"; fontSizeData?: { unit?: string; value?: number } }
  | { type: "LINK"; linkData?: { link?: RicosLinkTarget } }
  | { type: string; [key: string]: unknown };

interface RicosTextData {
  text?: string;
  decorations?: RicosTextDecoration[];
}

interface RicosSource {
  id?: string | null;
  url?: string | null;
}

interface RicosMediaFile {
  src?: RicosSource;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

interface NodeData {
  [key: string]: unknown;
}

interface RicosNode {
  type?: string;
  nodes?: RicosNode[];
  textData?: RicosTextData;
  headingData?: { level?: number };
  imageData?: NodeData;
  image?: { media?: RicosMediaFile };
  altText?: string | null;
  title?: string | null;
  videoData?: NodeData;
  audioData?: NodeData;
  galleryData?: NodeData;
  buttonData?: NodeData;
  tableData?: NodeData;
  tableCellData?: NodeData;
  collapsibleListData?: NodeData;
  htmlData?: NodeData;
  [key: string]: unknown;
}

export interface RicosDocument {
  nodes?: RicosNode[];
  [key: string]: unknown;
}

const STATIC_HOST = "https://static.wixstatic.com";
const VIDEO_HOST = "https://video.wixstatic.com";
const GALLERY_ITEM_WIDTH = 900;
const POSTER_WIDTH = 1200;

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

function fileUrl(source: RicosSource | undefined, host: string): string | null {
  const id = source?.id;
  if (id) return `${host}/${id.replace(/^\/+/, "")}`;
  const url = source?.url;
  return url && /^https?:\/\//.test(url) ? url : null;
}

// Proportional scale, never crop: height is derived from natural dims, the
// transform returns "missing h" without them.
function scaledImage(
  src: RicosSource | undefined,
  width: number,
  naturalWidth?: number | null,
  naturalHeight?: number | null,
): string | null {
  const raw = fileUrl(src, STATIC_HOST);
  if (!raw) return null;
  if (!naturalWidth || !naturalHeight) return raw;
  if (naturalWidth <= width) return raw;
  const height = Math.round((naturalHeight * width) / naturalWidth);
  return resolveWixImageUrl(raw, width, height) ?? raw;
}

function intrinsicAttrs(width?: unknown, height?: unknown): string {
  if (typeof width !== "number" || typeof height !== "number") return "";
  if (width <= 0 || height <= 0) return "";
  return ` width="${Math.floor(width)}" height="${Math.floor(height)}"`;
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
      const data = asTyped(node.imageData) as {
        image?: { src?: { id?: string | null }; width?: number | null; height?: number | null };
        altText?: string | null;
      };
      const mediaId = data?.image?.src?.id;
      if (!mediaId) return "";
      const src = resolveWixImageUrl(mediaId);
      if (!src) {
        console.warn("[ricos] unresolved IMAGE media id:", mediaId);
        return "";
      }
      // The recorded width/height are the editor's display box; Wix's own
      // viewer serves the fill crop at exactly that ratio (and may differ from
      // the file's natural shape), so mirror it for zero-CLS figures.
      let displaySrc = src;
      if (typeof data.image?.width === "number" && typeof data.image?.height === "number" && data.image.width > 0 && data.image.height > 0) {
        displaySrc = resolveWixImageUrl(src, data.image.width, data.image.height) ?? src;
      }
      const dims = intrinsicAttrs(data.image?.width, data.image?.height);
      const alt = escapeAttr(data.altText ?? "");
      const caption = (node.nodes ?? []).find((child) => child.type === "CAPTION");
      const figcaption = caption
        ? `<figcaption class="ricos-caption">${renderInlineChildren(caption)}</figcaption>`
        : "";
      return `<figure><img src="${escapeAttr(displaySrc)}" alt="${alt}"${dims} loading="lazy" decoding="async" />${figcaption}</figure>`;
    }

    case "GALLERY": {
      const data = asTyped(node.galleryData) as {
        items?: Array<{ image?: { media?: RicosMediaFile }; altText?: string | null; title?: string | null }>;
        options?: { layout?: { numberOfColumns?: number | null } };
      };
      const items = (data?.items ?? []).filter((item) => item.image?.media?.src?.id);
      if (items.length === 0) return "";
      const requested = asNumber(data?.options?.layout?.numberOfColumns);
      const cols = clampInt(requested, 1, 3) ?? (items.length > 4 ? 3 : 2);
      const images = items
        .map((item) => {
          const media = item.image?.media;
          const src = scaledImage(media?.src, GALLERY_ITEM_WIDTH, media?.width, media?.height);
          if (!src) return "";
          const dims = intrinsicAttrs(media?.width, media?.height);
          const alt = escapeAttr(item.altText ?? item.title ?? "");
          return `<img src="${escapeAttr(src)}" alt="${alt}"${dims} loading="lazy" decoding="async" />`;
        })
        .join("");
      return `<figure class="ricos-gallery" style="--ricos-gallery-cols:${cols};"><div class="ricos-gallery-grid">${images}</div></figure>`;
    }

    case "VIDEO": {
      const data = asTyped(node.videoData) as {
        video?: { src?: RicosSource; width?: number | null; height?: number | null };
        thumbnail?: { src?: RicosSource; width?: number | null; height?: number | null };
        title?: string | null;
      };
      const srcUrl = fileUrl(data?.video?.src, VIDEO_HOST);
      if (!srcUrl) return "";
      const poster = scaledImage(data?.thumbnail?.src, POSTER_WIDTH, data?.thumbnail?.width, data?.thumbnail?.height);
      const dims = intrinsicAttrs(data?.video?.width, data?.video?.height);
      const figcaption = data?.title ? `<figcaption class="ricos-caption">${escapeHtml(data.title)}</figcaption>` : "";
      return `<figure class="ricos-video"><video controls preload="none" src="${escapeAttr(srcUrl)}"${poster ? ` poster="${escapeAttr(poster)}"` : ""}${dims}></video>${figcaption}</figure>`;
    }

    case "AUDIO": {
      const data = asTyped(node.audioData) as {
        audio?: { src?: RicosSource };
        coverImage?: { src?: RicosSource; width?: number | null; height?: number | null };
        name?: string | null;
        authorName?: string | null;
      };
      const srcUrl = fileUrl(data?.audio?.src, STATIC_HOST);
      if (!srcUrl) return "";
      const cover = scaledImage(data?.coverImage?.src, GALLERY_ITEM_WIDTH, data?.coverImage?.width, data?.coverImage?.height);
      const name = data?.name ? escapeHtml(data.name) : "";
      const author = data?.authorName ? escapeHtml(data.authorName) : "";
      const label = [name, author].filter(Boolean).join(" — ");
      const figcaption = label ? `<figcaption class="ricos-caption">${label}</figcaption>` : "";
      const coverImg = cover ? `<img src="${escapeAttr(cover)}" alt="" loading="lazy" decoding="async" />` : "";
      return `<figure class="ricos-audio">${coverImg}<audio controls preload="none" src="${escapeAttr(srcUrl)}"></audio>${figcaption}</figure>`;
    }

    case "BUTTON": {
      const data = asTyped(node.buttonData) as {
        type?: string;
        text?: string | null;
        link?: RicosLinkTarget;
      };
      const url = data?.link?.url;
      if (!url || data.type !== "LINK") return "";
      const target = data.link?.target === "SELF" ? "_self" : "_blank";
      const selfRel = target === "_blank" ? ["noopener", "noreferrer"] : [];
      const flags = [
        ...selfRel,
        data.link?.nofollow ? "nofollow" : "",
        data.link?.sponsored ? "sponsored" : "",
        data.link?.ugc ? "ugc" : "",
      ].filter(Boolean);
      const rel = flags.length > 0 ? ` rel="${escapeAttr(flags.join(" "))}"` : "";
      return `<p class="ricos-cta"><a href="${escapeAttr(url)}" target="${target}"${rel}>${escapeHtml(data.text ?? "")}</a></p>`;
    }

    case "CODE_BLOCK": {
      const text = (node.nodes ?? [])
        .filter((child) => child.type === "TEXT")
        .map((child) => child.textData?.text ?? "")
        .join("\n");
      return `<pre class="ricos-code"><code>${escapeHtml(text)}</code></pre>`;
    }

    case "TABLE": {
      const rows = (node.nodes ?? []).filter((child) => child.type === "TABLE_ROW");
      if (rows.length === 0) return "";
      const data = asTyped(node.tableData) as {
        rowHeader?: boolean | null;
        columnHeader?: boolean | null;
        header?: boolean | null;
        dimensions?: { colsWidthRatio?: number[] } | null;
      };
      const rowHeader = data.rowHeader === true || data.header === true;
      const columnHeader = data.columnHeader === true;
      const ratios = (data.dimensions?.colsWidthRatio ?? []).filter((value) => typeof value === "number" && value > 0);
      const total = ratios.reduce((sum, value) => sum + value, 0);
      const colgroup =
        ratios.length > 0 && total > 0
          ? `<colgroup>${ratios
              .map((ratio) => `<col style="width:${Math.round((ratio / total) * 1000) / 10}%" />`)
              .join("")}</colgroup>`
          : "";
      const table = `<table>${colgroup}${rows
        .map((row, rowIndex) => {
          const cells = (row.nodes ?? []).filter((cell) => cell.type === "TABLE_CELL");
          return `<tr>${cells
            .map((cell, cellIndex) => {
              const cellData = asTyped(cell.tableCellData) as { colspan?: number | null; rowspan?: number | null };
              const isHeader = (rowIndex === 0 && rowHeader) || (cellIndex === 0 && columnHeader);
              const tag = isHeader ? "th" : "td";
              const span =
                (typeof cellData?.colspan === "number" && cellData.colspan > 1 ? ` colspan="${cellData.colspan}"` : "") +
                (typeof cellData?.rowspan === "number" && cellData.rowspan > 1 ? ` rowspan="${cellData.rowspan}"` : "");
              return `<${tag}${span}>${(cell.nodes ?? []).map(renderBlockNode).join("")}</${tag}>`;
            })
            .join("")}</tr>`;
        })
        .join("")}</table>`;
      return `<div class="ricos-table">${table}</div>`;
    }

    case "COLLAPSIBLE_LIST": {
      const initial = asTyped(node.collapsibleListData)?.initialExpandedItems;
      const items = (node.nodes ?? []).filter((child) => child.type === "COLLAPSIBLE_ITEM");
      if (items.length === 0) return "";
      const details = items
        .map((item, index) => {
          const titleNode = (item.nodes ?? []).find((child) => child.type === "COLLAPSIBLE_ITEM_TITLE");
          const bodyNode = (item.nodes ?? []).find((child) => child.type === "COLLAPSIBLE_ITEM_BODY");
          if (!titleNode) return "";
          const isOpen =
            initial === "ALL" || (initial === "FIRST" && index === 0);
          const summary = (titleNode.nodes ?? []).map(renderBlockNode).join("");
          const body = bodyNode ? (bodyNode.nodes ?? []).map(renderBlockNode).join("") : "";
          return `<details${isOpen ? " open" : ""}><summary>${summary}</summary><div class="ricos-details-body">${body}</div></details>`;
        })
        .join("");
      return `<div class="ricos-details">${details}</div>`;
    }

    case "HTML": {
      const data = asTyped(node.htmlData) as {
        url?: string;
        html?: string;
        source?: string;
        containerData?: { width?: { custom?: string; size?: string }; height?: { custom?: string; size?: string } };
      };
      if (!data) return "";
      const source = data.source ?? "HTML";
      if (source !== "HTML" && source !== "ADSENSE") return "";
      const style = dimensionStyle(
        data.containerData?.width,
        data.containerData?.height,
      );
      const wrapper = style ? `<div class="ricos-html"${style}>` : `<div class="ricos-html">`;
      if (data.html) return `${wrapper}${data.html}</div>`;
      if (data.url && /^https?:\/\//.test(data.url)) {
        return `${wrapper}<iframe src="${escapeAttr(data.url)}" loading="lazy" title="Embed" allowfullscreen></iframe></div>`;
      }
      return "";
    }

    default:
      return `<p>${renderInlineChildren(node)}</p>`;
  }
}

function asTyped(data: unknown): NodeData | null {
  return data && typeof data === "object" ? (data as NodeData) : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dimensionStyle(
  width?: { custom?: string; size?: string },
  height?: { custom?: string; size?: string },
): string | null {
  const parts: string[] = [];
  const w = width?.custom ?? (width?.size && /^\d+$/.test(width.size) ? width.size : null);
  const h = height?.custom ?? (height?.size && /^\d+$/.test(height.size) ? height.size : null);
  if (w) parts.push(`width:${w}px`);
  if (h) parts.push(`height:${h}px`);
  return parts.length > 0 ? ` style="${parts.join(";")}"` : null;
}

function clampInt(value: number | null, min: number, max: number): number | null {
  if (value == null) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
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
      case "STRIKETHROUGH":
        html = `<s>${html}</s>`;
        break;
      case "SPOILER":
        html = `<span class="ricos-spoiler">${html}</span>`;
        break;
      case "COLOR": {
        const foreground = asString((decoration as { colorData?: { foreground?: string } }).colorData?.foreground);
        const background = asString((decoration as { colorData?: { background?: string } }).colorData?.background);
        if (foreground || background) {
          const style = `color:${foreground ?? "inherit"};background-color:${background ?? "transparent"}`;
          html = `<span style="${escapeAttr(style)}">${html}</span>`;
        }
        break;
      }
      case "FONT_SIZE": {
        const data = (decoration as { fontSizeData?: { unit?: string; value?: number } }).fontSizeData;
        if (typeof data?.value !== "number" || !Number.isFinite(data.value)) break;
        const size =
          data.unit === "PERCENTAGE"
            ? Math.round((data.value / 100) * 160) / 10
            : Math.round(data.value * 10) / 10;
        if (size <= 0) break;
        html = `<span style="font-size:${size}px">${html}</span>`;
        break;
      }
      case "LINK": {
        const data = (decoration as { linkData?: { link?: RicosLinkTarget } }).linkData;
        const url = data?.link?.url;
        if (url) {
          const target = data.link?.target;
          const rel = target === "_blank" ? "noopener noreferrer" : undefined;
          linkOpen = `<a href="${escapeAttr(url)}"${target ? ` target="${escapeAttr(target)}"` : ""}${rel ? ` rel="${rel}"` : ""}>`;
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

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
