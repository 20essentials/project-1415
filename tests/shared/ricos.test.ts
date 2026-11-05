import { describe, expect, it, vi } from 'vitest';
import { renderRicos, type RicosDocument } from '@/shared/ricos';

vi.mock('@wix/sdk', () => ({
  media: {
    getScaledToFillImageUrl: (src: string, width: number, height: number) => `${src}/v1/fill/w_${width},h_${height}`,
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
      '<figure><img src="https://static.wixstatic.com/media/600582_b252~mv2.png/v1/fill/w_1024,h_768" alt="Trap close-up" width="1024" height="768" loading="lazy" decoding="async" /></figure>',
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

describe('renderRicos lists', () => {
  it('renders list items whose text nodes hold the content directly (CMS-stored shape)', () => {
    const html = renderRicos(
      doc([
        {
          type: 'BULLETED_LIST',
          nodes: [
            { type: 'LIST_ITEM', nodes: [{ type: 'TEXT', textData: { text: 'Top up the water tray daily' } }] },
            { type: 'LIST_ITEM', nodes: [{ type: 'TEXT', textData: { text: 'Keep humidity high' } }] },
          ],
        },
      ]),
    );
    expect(html).toBe('<ul><li><p>Top up the water tray daily</p></li><li><p>Keep humidity high</p></li></ul>');
  });

  it('renders list items containing paragraphs (Ricos editor shape)', () => {
    const html = renderRicos(
      doc([
        {
          type: 'ORDERED_LIST',
          nodes: [
            {
              type: 'LIST_ITEM',
              nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Drain after soaking' } }] }],
            },
          ],
        },
      ]),
    );
    expect(html).toBe('<ol><li><p>Drain after soaking</p></li></ol>');
  });
});

describe('renderRicos plugins', () => {
  it('renders a CAPTION child as figcaption inside the figure', () => {
    const html = renderRicos(
      doc([
        {
          type: 'IMAGE',
          nodes: [{ type: 'CAPTION', nodes: [{ type: 'TEXT', textData: { text: 'Figure 1', decorations: [] } }] }],
          imageData: { image: { src: { id: '600582_b252~mv2.png' }, width: 900, height: 600 }, altText: 'Trap' },
        },
      ]),
    );
    expect(html).toBe(
      '<figure><img src="https://static.wixstatic.com/media/600582_b252~mv2.png/v1/fill/w_900,h_600" alt="Trap" width="900" height="600" loading="lazy" decoding="async" /><figcaption class="ricos-caption">Figure 1</figcaption></figure>',
    );
  });

  it('renders a gallery grid with column count and per-item scaling', () => {
    const html = renderRicos(
      doc([
        {
          type: 'GALLERY',
          galleryData: {
            items: [
              { image: { media: { src: { id: 'ffe5cc2_abc.jpg' }, width: 1800, height: 1200 } }, altText: 'One' },
              { image: { media: { src: { id: 'ffe5cc2_def.jpg' }, width: 1920, height: 1280 } } },
            ],
            options: { layout: { numberOfColumns: 3 } },
          },
        },
      ]),
    );
    expect(html).toContain('class="ricos-gallery" style="--ricos-gallery-cols:3;"');
    expect(html).toContain(
      '<img src="https://static.wixstatic.com/ffe5cc2_def.jpg/v1/fill/w_900,h_600" alt="" width="1920" height="1280" loading="lazy" decoding="async" />',
    );
    const first = html.match(/<img [^>]*ffe5cc2_abc\.jpg[^>]*>/)?.[0] ?? '';
    expect(first).toBe(
      '<img src="https://static.wixstatic.com/ffe5cc2_abc.jpg/v1/fill/w_900,h_600" alt="One" width="1800" height="1200" loading="lazy" decoding="async" />',
    );
  });

  it('renders an uploaded video with poster and title caption', () => {
    const html = renderRicos(
      doc([
        {
          type: 'VIDEO',
          videoData: {
            video: { src: { id: 'video/11062b_a552/1080p/mp4/file.mp4' } },
            thumbnail: { src: { id: 'media/11062b_a552f000.jpg' }, width: 1920, height: 1080 },
            title: 'Feeding time',
          },
        },
      ]),
    );
    expect(html).toBe(
      '<figure class="ricos-video"><video controls preload="none" src="https://video.wixstatic.com/video/11062b_a552/1080p/mp4/file.mp4" poster="https://static.wixstatic.com/media/11062b_a552f000.jpg/v1/fill/w_1200,h_675"></video><figcaption class="ricos-caption">Feeding time</figcaption></figure>',
    );
  });

  it('drops a VIDEO node when no media source resolves', () => {
    expect(renderRicos(doc([{ type: 'VIDEO', videoData: { video: {} } }]))).toBe('');
  });

  it('renders an audio block with cover, track name and author', () => {
    const html = renderRicos(
      doc([
        {
          type: 'AUDIO',
          nodes: [],
          audioData: {
            audio: { src: { id: 'mp3/f0f74f_48772.mp3' } },
            coverImage: { src: { id: 'f0f74f_cover.png' }, width: 436, height: 524 },
            name: 'Bog ambience',
            authorName: 'Studio',
          },
        },
      ]),
    );
    expect(html).toBe(
      '<figure class="ricos-audio"><img src="https://static.wixstatic.com/f0f74f_cover.png" alt="" loading="lazy" decoding="async" /><audio controls preload="none" src="https://static.wixstatic.com/mp3/f0f74f_48772.mp3"></audio><figcaption class="ricos-caption">Bog ambience — Studio</figcaption></figure>',
    );
  });

  it('renders a LINK button and skips ACTION buttons', () => {
    const link = renderRicos(
      doc([
        {
          type: 'BUTTON',
          buttonData: {
            type: 'LINK',
            text: 'Shop traps',
            link: { url: '/products', target: 'BLANK' },
          },
        },
      ]),
    );
    expect(link).toBe('<p class="ricos-cta"><a href="/products" target="_blank" rel="noopener noreferrer">Shop traps</a></p>');
    const action = renderRicos(doc([{ type: 'BUTTON', buttonData: { text: 'Click', link: { url: '/x' } } }]));
    expect(action).toBe('');
  });

  it('renders a table with ratio-based colgroup, headers and escaped cells', () => {
    const html = renderRicos(
      doc([
        {
          type: 'TABLE',
          nodes: [
            {
              type: 'TABLE_ROW',
              nodes: [
                { type: 'TABLE_CELL', tableCellData: {}, nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Plan <b>' } }] }] },
                { type: 'TABLE_CELL', tableCellData: {}, nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'Price' } }] }] },
              ],
            },
            {
              type: 'TABLE_ROW',
              nodes: [
                { type: 'TABLE_CELL', tableCellData: { colspan: 2 }, nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: 'All included' } }] }] },
              ],
            },
          ],
          tableData: { rowHeader: true, dimensions: { colsWidthRatio: [60, 40] } },
        },
      ]),
    );
    expect(html).toContain('<colgroup><col style="width:60%" /><col style="width:40%" /></colgroup>');
    expect(html).toContain('<th><p>Plan &lt;b&gt;</p></th><th><p>Price</p></th>');
    expect(html).toContain('<td colspan="2"><p>All included</p></td>');
  });

  it('renders a code block joining TEXT children with newlines and escaping', () => {
    const html = renderRicos(
      doc([
        {
          type: 'CODE_BLOCK',
          nodes: [
            { type: 'TEXT', textData: { text: 'npm install', decorations: [] } },
            { type: 'TEXT', textData: { text: 'wix build <svc>', decorations: [] } },
          ],
          codeBlockData: {},
        },
      ]),
    );
    expect(html).toBe('<pre class="ricos-code"><code>npm install\nwix build &lt;svc&gt;</code></pre>');
  });

  it('renders collapsible items with FIRST expanded by default', () => {
    const html = renderRicos(
      doc([
        {
          type: 'COLLAPSIBLE_LIST',
          nodes: [
            item('How often?', 'Twice a week.'),
            item('Which tray?', 'The outer one.'),
          ],
          collapsibleListData: { initialExpandedItems: 'FIRST' },
        },
      ]),
    );
    const details = html.match(/<details[^>]*>/g) ?? [];
    expect(details).toEqual(['<details open>', '<details>']);
    expect(html).toContain('<summary><p>How often?</p></summary>');
    expect(html).toContain('<div class="ricos-details-body"><p>Twice a week.</p></div>');

    function item(title: string, body: string) {
      return {
        type: 'COLLAPSIBLE_ITEM',
        nodes: [
          {
            type: 'COLLAPSIBLE_ITEM_TITLE',
            nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: title } }] }],
          },
          {
            type: 'COLLAPSIBLE_ITEM_BODY',
            nodes: [{ type: 'PARAGRAPH', nodes: [{ type: 'TEXT', textData: { text: body } }] }],
          },
        ],
      };
    }
  });

  it('renders an iframe HTML embed from url and an inline html block', () => {
    const iframe = renderRicos(
      doc([
        {
          type: 'HTML',
          htmlData: {
            url: 'https://www.youtube.com/embed/abc',
            source: 'HTML',
            containerData: { width: { custom: '550' }, height: { custom: '310' } },
          },
        },
      ]),
    );
    expect(iframe).toBe(
      '<div class="ricos-html" style="width:550px;height:310px"><iframe src="https://www.youtube.com/embed/abc" loading="lazy" title="Embed" allowfullscreen></iframe></div>',
    );

    const inline = renderRicos(doc([{ type: 'HTML', htmlData: { html: '<marquee>hi</marquee>', source: 'HTML' } }]));
    expect(inline).toBe('<div class="ricos-html"><marquee>hi</marquee></div>');
  });

  it('skips HTML embeds from unsupported sources', () => {
    expect(renderRicos(doc([{ type: 'HTML', htmlData: { url: 'https://a.com', source: 'AI_WIDGET' } }]))).toBe('');
  });
});

describe('renderRicos decorations', () => {
  it('renders strikethrough, color, font size and spoiler', () => {
    const html = renderRicos(
      doc([
        {
          type: 'PARAGRAPH',
          nodes: [
            { type: 'TEXT', textData: { text: 'cut', decorations: [{ type: 'STRIKETHROUGH' }] } },
            { type: 'TEXT', textData: { text: 'hot', decorations: [{ type: 'COLOR', colorData: { foreground: '#18E299' } }] } },
            { type: 'TEXT', textData: { text: 'big', decorations: [{ type: 'FONT_SIZE', fontSizeData: { unit: 'PERCENTAGE', value: 125 } }] } },
            { type: 'TEXT', textData: { text: 'secret', decorations: [{ type: 'SPOILER' }] } },
          ],
        },
      ]),
    );
    expect(html).toBe(
      '<p><s>cut</s><span style="color:#18E299;background-color:transparent">hot</span><span style="font-size:20px">big</span><span class="ricos-spoiler">secret</span></p>',
    );
  });
});
