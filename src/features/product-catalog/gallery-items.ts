import { resolveWixImageUrl } from "@/shared/wix-image";
import { media as wixMedia, VideoResolution } from "@wix/sdk";
import type { V3Product } from "@wix/auto_sdk_stores_products-v-3";

export type GalleryItem = {
  kind: "image" | "video";
  src: string;
  poster: string;
  thumb: string;
  preview: string;
  alt: string;
};

type ImageSource = string | { id?: string; url?: string } | null | undefined;

type VideoLike = {
  resolutions?: Array<{ url?: string; format?: string }>;
  posters?: Array<{ url?: string }>;
};

type MediaLike = {
  _id?: string;
  url?: string;
  altText?: string | null;
  mediaType?: string | null;
  image?: ImageSource;
  video?: string | VideoLike | null;
  thumbnail?: { url?: string } | null;
};

const WIX_MEDIA_PREFIX = /^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/;

// Wix only resizes through the /v1/ transform path; query params like ?w= are ignored
// and would ship the full-resolution file.
function wixFill(url: string | null | undefined, width: number, height: number): string | null {
  if (!url) return null;
  const match = url.split("?")[0].match(WIX_MEDIA_PREFIX);
  if (!match) return url;
  return `${match[1]}/v1/fill/w_${width},h_${height},q_90/file.jpg`;
}

function resolveSource(source: ImageSource): string | null {
  if (!source) return null;
  if (typeof source === "string") {
    if (/^https?:\/\//.test(source) || source.startsWith("/")) return source;
    return resolveWixImageUrl(source);
  }
  return source.url ?? resolveWixImageUrl(source.id);
}

function videoSource(media: MediaLike): { src: string; poster: string } | null {
  const video = media.video;

  if (video && typeof video === "object") {
    const resolutions = (video.resolutions ?? []).filter((resolution) => resolution.url);
    const mp4 = resolutions.find((resolution) => (resolution.format ?? "").toLowerCase() === "mp4");
    const src = mp4?.url ?? resolutions[0]?.url;
    if (!src) return null;
    const poster = video.posters?.[0]?.url ?? media.thumbnail?.url ?? "";
    return { src, poster };
  }

  if (typeof video === "string") {
    // The SDK returns videos as wix:video URIs, not objects.
    if (video.startsWith("wix:video://")) {
      const resolved = wixMedia.getVideoUrl(video, VideoResolution.MID);
      return { src: resolved.url, poster: resolved.thumbnail };
    }
    if (/^https?:\/\//.test(video)) {
      return { src: video, poster: media.thumbnail?.url ?? "" };
    }
    return null;
  }

  if (media.mediaType === "VIDEO" && media.url) {
    return { src: media.url, poster: media.thumbnail?.url ?? "" };
  }

  return null;
}

function toGalleryItem(media: MediaLike, fallbackAlt: string): GalleryItem | null {
  const alt = media.altText ?? fallbackAlt;
  const video = videoSource(media);

  if (video) {
    const posterRaw = resolveSource(video.poster);
    return {
      kind: "video",
      src: video.src,
      poster: wixFill(posterRaw, 1280, 720) ?? "",
      thumb: wixFill(posterRaw, 320, 320) ?? "",
      preview: wixFill(posterRaw, 640, 640) ?? "",
      alt,
    };
  }

  const source = resolveSource(media.image ?? media._id ?? media.url);
  const full = wixFill(source, 1200, 1200);
  if (!full) return null;

  return {
    kind: "image",
    src: full,
    poster: full,
    thumb: wixFill(source, 320, 320) ?? full,
    preview: wixFill(source, 640, 640) ?? full,
    alt,
  };
}

export function buildProductGallery(product: V3Product, fallbackAlt: string): GalleryItem[] {
  const fallback = product.name ?? fallbackAlt;
  const items: GalleryItem[] = [];
  const mediaItems = (product.media?.itemsInfo?.items ?? []) as MediaLike[];

  for (const media of mediaItems) {
    const item = toGalleryItem(media, fallback);
    if (item) items.push(item);
  }

  if (items.length === 0 && product.media?.main) {
    const main = toGalleryItem(product.media.main as MediaLike, fallback);
    if (main) items.push(main);
  }

  return centerSingleVideo(items);
}

// El mosaico 3×3 del PDP reserva el tile central (fila 2, columna 2) para el
// único video de la galería; Wix entrega los videos al final del orden.
function centerSingleVideo(items: GalleryItem[]): GalleryItem[] {
  if (items.length !== 9) return items;
  const videos = items.filter((item) => item.kind === "video");
  if (videos.length !== 1) return items;
  const [video] = videos;
  const images = items.filter((item) => item.kind === "image");
  return [...images.slice(0, 4), video, ...images.slice(4)];
}
