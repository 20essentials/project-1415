import { describe, expect, it, vi } from 'vitest';
import { renderRicos, type RicosDocument } from '@/shared/ricos';

vi.mock('@wix/sdk', () => ({
  media: {
    getScaledToFillImageUrl: vi.fn(),
    getImageUrl: (raw: string) => ({
      url: `https://static.wixstatic.com/media/${raw}`,
      width: undefined,
      height: undefined,
    }),
  },
}));

const doc = (nodes: NonNullable<RicosDocument['nodes']>): RicosDocument => ({ nodes });

describe('renderRicos IMAGE', () => {
  it('renders an inline image from its media id with alt text and intrinsic size', () => {
    const html = renderRicos(
      doc([
        {
          type: 'IMAGE',
          nodes: [],
          imageData: {
            image: { src: { id: '600582_b252~mv2.png' }, width: 1024, height: 768 },
            altText: 'Trap close-up',
          },
        },
      ]),
    );

    expect(html).toBe(
      '<figure><img src="https://static.wixstatic.com/media/600582_b252~mv2.png" alt="Trap close-up" width="1024" height="768" loading="lazy" decoding="async" /></figure>',
    );
  });

  it('renders an image without dimensions when width/height are absent', () => {
    const html = renderRicos(doc([{ type: 'IMAGE', nodes: [], imageData: { image: { src: { id: 'abc' } } } }]));
    expect(html).toBe('<figure><img src="https://static.wixstatic.com/media/abc" alt="" loading="lazy" decoding="async" /></figure>');
  });

  it('renders nothing for an image without a media id', () => {
    expect(renderRicos(doc([{ type: 'IMAGE', nodes: [], imageData: { image: { src: {} } } }]))).toBe('');
  });

  it('keeps text escaped inside a paragraph next to the image', () => {
    const html = renderRicos(
      doc([
        { type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'a & <b>', decorations: [] } }] },
        { type: 'IMAGE', nodes: [], imageData: { image: { src: { id: 'abc' } } } },
      ]),
    );
    expect(html).toBe('<p>a &amp; &lt;b&gt;</p><figure><img src="https://static.wixstatic.com/media/abc" alt="" loading="lazy" decoding="async" /></figure>');
  });
});
