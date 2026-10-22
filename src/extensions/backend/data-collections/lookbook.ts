import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'lookbook';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Lookbook',
  displayField: 'season',
  fields: [
    { key: 'season', displayName: 'Season', type: 'TEXT' },
    { key: 'title', displayName: 'Title', type: 'TEXT' },
    { key: 'tagline', displayName: 'Tagline', type: 'TEXT' },
    { key: 'story', displayName: 'Story', type: 'RICH_TEXT' },
    { key: 'heroImage', displayName: 'Hero image', type: 'IMAGE' },
    { key: 'gallery', displayName: 'Gallery', type: 'MEDIA_GALLERY' },
    { key: 'productSlugs', displayName: 'Product slugs', type: 'ARRAY_STRING' },
    { key: 'orderIndex', displayName: 'Order index', type: 'NUMBER' },
  ],
  dataPermissions: {
    itemRead: 'ANYONE',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
  },
  indexes: [],
  initialData: [
    {
      season: 'Spring 2026',
      title: 'First light',
      tagline: 'New growth, cool mornings, and the first traps of the year.',
      heroImage:
        'wix:image://v1/600582_526302ce073241ff8aa8c85127698cda~mv2.jpg/spring-hero.jpg',
      gallery: [
        'wix:image://v1/600582_d9acc05b85c449968e88e1d2e67a0777~mv2.jpg/spring-1.jpg',
        'wix:image://v1/600582_9b73f2171c54492db85a255a02b0cabe~mv2.jpg/spring-2.jpg',
        'wix:image://v1/600582_2b2e94a7d0674d94b165641651bf1b6f~mv2.jpg/spring-3.jpg',
        'wix:image://v1/600582_31b070b9fde449099e2af1b95c7bf254~mv2.jpg/spring-4.jpg',
      ],
      productSlugs: ['venus-flytrap-akai-ryu', 'cape-sundew', 'carnivorous-starter-kit'],
      orderIndex: 1,
      story: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Spring reaches the greenhouse before it reaches the windowsill — cooler nights, brighter days, and the first new traps pushing up through the moss.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'What the season asks for' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'This is the moment to repot, refresh the substrate and let the plants drink rainwater again. Bright, indirect light and a little patience do most of the work.',
                },
              },
            ],
          },
          {
            type: 'BULLETED_LIST',
            nodes: [
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Repot into fresh, nutrient-poor medium' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Switch to rainwater or distilled' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Move to a brighter windowsill, away from harsh midday sun',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      season: 'Summer 2026',
      title: 'The long green',
      tagline: 'Peak pitcher season on a bright windowsill.',
      heroImage:
        'wix:image://v1/600582_6de87b2793f345b6bd8fcce8f3d2e19e~mv2.jpg/summer-hero.jpg',
      gallery: [
        'wix:image://v1/600582_19b6f0c2233441b1a12e35f808c779c8~mv2.jpg/summer-1.jpg',
        'wix:image://v1/600582_4b570533e7a9480395709829d45dd119~mv2.jpg/summer-2.jpg',
        'wix:image://v1/600582_ab09059a609d4d43a7e47dee3059ed5e~mv2.jpg/summer-3.jpg',
        'wix:image://v1/600582_f61422d5fda347159e641ff83ec330c6~mv2.jpg/summer-4.jpg',
      ],
      productSlugs: ['nepenthes-pitcher-plant', 'moonlight-orchid', 'venus-flytrap-akai-ryu'],
      orderIndex: 2,
      story: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'High summer is when the collection does its loudest growing. Pitchers fill out, sundews redden under strong light, and humidity finally does what we have been asking of it all year.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Keep the water tray full' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'In heat everything dries faster. Stand carnivorous plants in a shallow tray of rainwater and check it every morning; orchids prefer a soak-and-drain rhythm instead.',
                },
              },
            ],
          },
          {
            type: 'BULLETED_LIST',
            nodes: [
              {
                type: 'LIST_ITEM',
                nodes: [
                  { type: 'TEXT', textData: { text: 'Top up the water tray daily' } },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Keep humidity high for pitchers' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Shade only the harshest midday sun' },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      season: 'Autumn 2026',
      title: 'Amber hours',
      tagline: 'Slower light, deeper colour, and dormancy done right.',
      heroImage:
        'wix:image://v1/600582_8af2be0e8d734ee789a106237a8fbfb7~mv2.jpg/autumn-hero.jpg',
      gallery: [
        'wix:image://v1/600582_a5cd03ab246d4b53ab908c53d1d0a264~mv2.jpg/autumn-1.jpg',
        'wix:image://v1/600582_1a8ca72eb6cc464389cbcd9a50495cc0~mv2.jpg/autumn-2.jpg',
        'wix:image://v1/600582_78ad59df5f6642a9929d96ac6e8d3abb~mv2.jpg/autumn-3.jpg',
        'wix:image://v1/600582_fda559b7b6014d84a3cdfec1c46d00f8~mv2.jpg/autumn-4.jpg',
      ],
      productSlugs: ['moonlight-orchid', 'nepenthes-pitcher-plant', 'cape-sundew'],
      orderIndex: 3,
      story: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Autumn turns the greenhouse gold at the edges. Growth slows, colours deepen, and the carnivores begin preparing for their winter rest — the part most growers get wrong.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Let them slow down' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Shortening days are a signal, not a problem. Ease off feeding, keep the medium just damp, and let temperate species cool down so they come back strong in spring.',
                },
              },
            ],
          },
          {
            type: 'BULLETED_LIST',
            nodes: [
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Reduce feeding as growth slows' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Keep damp, never waterlogged' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Allow cooler nights for dormancy' },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ],
} satisfies DataCollection;
