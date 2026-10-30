import { media } from "@wix/sdk";

export type WixImage = {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
};

export function resolveWixImage(
  image: string | { id?: string; url?: string } | null | undefined
): WixImage | null {
  if (!image) return null;

  if (typeof image === "string") {
    if (image.startsWith("wix:image://")) {
      const resolved = media.getImageUrl(image);
      return { url: resolved.url, width: resolved.width, height: resolved.height };
    }
    if (!/^(https?:)?\/\/|^data:|^wix:|^\/|^#/.test(image)) {
      // Bare media id: the SDK helpers only parse wix: URIs, so build the
      // canonical static URL directly.
      return { url: `https://static.wixstatic.com/media/${image}` };
    }
    return { url: image };
  }

  if (image.url) {
    return { url: image.url };
  }

  if (image.id) {
    const resolved = media.getImageUrl(image.id);
    return { url: resolved.url, width: resolved.width, height: resolved.height };
  }

  return null;
}

export function scaledSrc(img: WixImage, width: number): string {
  const url = new URL(img.url);
  url.searchParams.set("w", String(width));
  return url.toString();
}

export function srcSet(img: WixImage, widths: number[]): string {
  return widths.map((w) => `${scaledSrc(img, w)} ${w}w`).join(", ");
}

// Consumed by every vertical that renders a Wix image at a specific size
// (stores product-card + detail page, blog post hero, cms list thumbnails).
// Kept alongside resolveWixImage so verticals do not ship their own copy.
export function resolveWixImageUrl(
  image: string | { id?: string; url?: string } | null | undefined,
  width?: number,
  height?: number,
): string | null {
  if (!image) return null;
  const sized = width != null && height != null;

  if (typeof image === "string" && image.startsWith("wix:image://")) {
    if (sized) return media.getScaledToFillImageUrl(image, width, height, {});
    return media.getImageUrl(image).url;
  }

  const resolved = resolveWixImage(image);
  if (!resolved) return null;
  if (width == null && height == null) return resolved.url;

  // Wix only resizes through the /v1/ transform path; ?w=&h= is ignored and
  // still ships the full-resolution original.
  if (sized && resolved.url.startsWith("https://static.wixstatic.com/")) {
    return media.getScaledToFillImageUrl(resolved.url, width, height, {});
  }

  const url = new URL(resolved.url);
  if (width != null) url.searchParams.set("w", String(width));
  if (height != null) url.searchParams.set("h", String(height));
  return url.toString();
}
