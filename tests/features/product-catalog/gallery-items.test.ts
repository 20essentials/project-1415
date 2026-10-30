import { describe, expect, it } from "vitest";
import { buildProductGallery } from "@/features/product-catalog/gallery-items";
import type { V3Product } from "@wix/auto_sdk_stores_products-v-3";

const IMAGE_URL = "https://static.wixstatic.com/media/plant~mv2.jpg";

function product(media: unknown): V3Product {
  return { name: "Test plant", media } as V3Product;
}

describe("buildProductGallery", () => {
  it("returns every media item in order with square image URLs", () => {
    const items = buildProductGallery(
      product({
        itemsInfo: {
          items: [
            { image: IMAGE_URL, altText: "Front" },
            { image: { url: "https://static.wixstatic.com/media/back~mv2.jpg" } },
          ],
        },
      }),
      "Product photo",
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ kind: "image", alt: "Front" });
    expect(items[0].src).toContain("/v1/fill/w_1200,h_1200,q_90/");
    expect(items[0].thumb).toContain("/v1/fill/w_320,h_320,q_90/");
    expect(items[1].alt).toBe("Test plant");
  });

  it("uses the mp4 resolution and poster frame for videos", () => {
    const items = buildProductGallery(
      product({
        itemsInfo: {
          items: [
            {
              altText: "Care video",
              video: {
                resolutions: [
                  { url: "https://video.wixstatic.com/video/care/file.m3u8", format: "hls" },
                  { url: "https://video.wixstatic.com/video/care/720/file.mp4", format: "mp4" },
                ],
                posters: [{ url: "https://static.wixstatic.com/media/care-f001.jpg" }],
              },
            },
          ],
        },
      }),
      "Product photo",
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "video",
      src: "https://video.wixstatic.com/video/care/720/file.mp4",
      alt: "Care video",
    });
    expect(items[0].poster).toContain("/v1/fill/w_1280,h_720,q_90/");
    expect(items[0].thumb).toContain("/v1/fill/w_320,h_320,q_90/");
  });

  it("resolves the SDK wix:video URI shape into a playable mp4 and poster", () => {
    const items = buildProductGallery(
      product({
        itemsInfo: {
          items: [
            {
              mediaType: "VIDEO",
              video:
                "wix:video://v1/600582_abc/v1.mp4#posterUri=600582_abc%2Ff001.jpg&posterWidth=1280&posterHeight=720",
            },
          ],
        },
      }),
      "Product photo",
    );

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("video");
    expect(items[0].src).toBe("https://video.wixstatic.com/video/600582_abc/720p/mp4/file.mp4");
    expect(items[0].poster).toContain("/v1/fill/w_1280,h_720,q_90/");
  });

  it("skips media without a usable source", () => {
    const items = buildProductGallery(
      product({
        itemsInfo: { items: [{ image: null }, { video: null }] },
      }),
      "Product photo",
    );

    expect(items).toEqual([]);
  });

  it("falls back to the main media when the items list is empty", () => {
    const items = buildProductGallery(
      product({ itemsInfo: { items: [] }, main: { image: IMAGE_URL, altText: "Main" } }),
      "Product photo",
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "image", alt: "Main" });
  });

  it("center the single video in a full 9-item gallery for the 3x3 mosaic", () => {
    const media = [
      ...Array.from({ length: 8 }, (_, index) => ({
        image: { url: `${IMAGE_URL}?w=400#img-${index + 1}` },
      })),
      // Wix entrega el video al final del orden.
      {
        altText: "Overview video",
        video: { resolutions: [{ url: "https://video.wixstatic.com/plant.mp4", format: "mp4" }] },
      },
    ];
    const items = buildProductGallery(product({ itemsInfo: { items: media } }), "Product photo");

    expect(items).toHaveLength(9);
    expect(items[4]).toMatchObject({ kind: "video", alt: "Overview video" });
    expect(items.filter((item) => item.kind === "image")).toHaveLength(8);
  });

  it("keeps Wix order for galleries other than full 3x3", () => {
    const media = [
      { image: IMAGE_URL },
      { video: { resolutions: [{ url: "https://video.wixstatic.com/plant.mp4", format: "mp4" }] } },
      { image: { url: "https://static.wixstatic.com/media/detail~mv2.jpg" } },
    ];
    const items = buildProductGallery(product({ itemsInfo: { items: media } }), "Product photo");

    expect(items.map((item) => item.kind)).toEqual(["image", "video", "image"]);
  });
});
