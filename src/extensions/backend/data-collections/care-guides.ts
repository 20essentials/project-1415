import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'care-guides';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Care Guides',
  displayField: 'title',
  fields: [
    { key: 'title', displayName: 'Title', type: 'TEXT' },
    { key: 'slug', displayName: 'Slug', type: 'TEXT' },
    { key: 'intro', displayName: 'Intro', type: 'TEXT' },
    { key: 'body', displayName: 'Body', type: 'RICH_TEXT' },
    { key: 'plantTag', displayName: 'Plant tag', type: 'TEXT' },
    { key: 'coverImage', displayName: 'Cover image', type: 'IMAGE' },
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
      title: 'Watering a Venus Flytrap',
      slug: 'watering-a-venus-flytrap',
      intro:
        'Venus flytraps drink from the soil, not the sky. Here is the simple water rule that keeps traps snapping.',
      plantTag: 'Venus Flytrap',
      coverImage:
        'wix:image://v1/600582_b252397a69574412b47eceae892d99a5~mv2.png/venus-flytrap-akai-ryu.png',
      body: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Venus flytraps evolved in poor, waterlogged soil, and their whole water strategy depends on it. Watering from the top like a houseplant is the single most common way growers lose a flytrap.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Use only low-mineral water' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Tap water in most cities carries minerals that build up in the soil and burn the roots over time. Rainwater, distilled water, or reverse-osmosis water are safe.',
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
                    type: 'PARAGRAPH',
                    nodes: [
                      {
                        type: 'TEXT',
                        textData: { text: 'Rainwater collected in a clean bucket — first choice' },
                      },
                    ],
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'PARAGRAPH',
                    nodes: [
                      {
                        type: 'TEXT',
                        textData: { text: 'Distilled or reverse-osmosis water — second choice' },
                      },
                    ],
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'PARAGRAPH',
                    nodes: [
                      {
                        type: 'TEXT',
                        textData: {
                          text: 'Never tap water, bottled mineral water, or softened water',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Water from below, keep it damp' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Stand the pot in a saucer of water about 1–2 cm deep and let the soil pull moisture upward. Top up when the saucer dries out. The goal is soil like a wrung-out sponge — never bone dry, never flooded.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'The tray method, week by week' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'A simple routine: check the saucer every few days, refill with the mineral-free water, and empty and refill it once a week so salts cannot concentrate.',
                },
              },
            ],
          },
          {
            type: 'BLOCKQUOTE',
            nodes: [
              {
                type: 'PARAGRAPH',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'If the traps are dark and the soil smells sour, the plant is too wet. Let the saucer dry for two days and resume.',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Feed nothing. A flytrap on a windowsill catches enough on its own, and fertiliser will only burn the roots you just protected.',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Repotting without shock',
      slug: 'repotting-without-shock',
      intro:
        'Carnivorous plants are fussy about their soil. Repot gently, with the right mix, and they barely notice the move.',
      plantTag: 'Care basics',
      coverImage:
        'wix:image://v1/600582_81415a9706e549c2ba811c722a1557e4~mv2.png/carnivorous-starter-kit.png',
      body: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Ordinary potting compost will kill most carnivorous plants. They need a lean, mineral-free mix, and the best time to move them is early spring as growth restarts.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Use the right mix' } }],
          },
          {
            type: 'BULLETED_LIST',
            nodes: [
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Venus flytraps and sundews: pure sphagnum peat with perlite',
                    },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Nepenthes: loose sphagnum moss with bark for drainage',
                    },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Never ordinary compost, and never anything with added fertiliser',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Move fast, keep it wet' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Work quickly so the roots never dry out. Swiftly rinse the old mix off with mineral-free water, tease the roots apart gently, and settle the plant into its new pot at the same depth.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'After the move' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Water from below and keep the plant out of strong direct sun for about a week. Skip feeding entirely for the first month. A little yellowing is normal; new growth is the sign that it settled in.',
                },
              },
            ],
          },
          {
            type: 'BLOCKQUOTE',
            nodes: [
              {
                type: 'PARAGRAPH',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Repot in spring, never in winter. A plant moved while dormant can sit still for months before it forgives you.',
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
      title: 'Sundew light',
      slug: 'sundew-light',
      intro:
        'Cape sundews glow red and cover themselves in dew only when the light is strong enough. Here is how much they want.',
      plantTag: 'Cape Sundew',
      coverImage:
        'wix:image://v1/600582_a4a868584ac546be8f629740a531873c~mv2.png/cape-sundew.png',
      body: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Drosera capensis is one of the easiest carnivorous plants, but it is not a low-light houseplant. Light drives the dew, and the dew catches the insects.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Six or more hours of direct sun' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'A sunny south- or east-facing windowsill works for most of the year. In weaker light the plant stays green, stops producing dew, and slowly weakens.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Reading the colour' } }],
          },
          {
            type: 'BULLETED_LIST',
            nodes: [
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Deep red tentacles and sparkling dew — ideal light' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'All green with little dew — needs more sun' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Scorched, bleached leaves in summer — afternoon shade helps',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Grow lights in winter' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'When daylight shortens, a simple full-spectrum LED for 12 hours a day keeps the plant productive. Keep the light 15–20 cm above the leaves and adjust if the tips bleach.',
                },
              },
            ],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'With enough light a sundew will flower freely and self-seed around the pot — the clearest sign the spot is right.',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Humidity for Nepenthes',
      slug: 'humidity-for-nepenthes',
      intro:
        'Tropical pitcher plants make pitchers only when the air stays humid. Here is how to keep Nepenthes happy indoors.',
      plantTag: 'Nepenthes',
      coverImage:
        'wix:image://v1/600582_0a3bed7df7f34a19ac46ed7ed8afa118~mv2.png/nepenthes-pitcher-plant.png',
      body: {
        nodes: [
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Nepenthes grows as a vine in warm, humid jungle air. Indoors, dry air is the usual reason new leaves never develop a pitcher.',
                },
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Aim for 60–80% humidity' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'The plant will survive lower humidity, but the pitchers it makes will be small or absent. Raise humidity around the plant rather than trying to humidify a whole room.',
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
                    textData: { text: 'Group Nepenthes with other plants to trap moisture' },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Stand the pot on a tray of pebbles with water below the pot',
                    },
                  },
                ],
              },
              {
                type: 'LIST_ITEM',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: { text: 'Mist the leaves in the morning, not at night' },
                  },
                ],
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Water the moss, not the pitchers' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'Keep the potting mix evenly moist with mineral-free water. Never let the pitchers fill with water you add — they make their own fluid and can rot if refilled.',
                },
              },
            ],
          },
          {
            type: 'BLOCKQUOTE',
            nodes: [
              {
                type: 'PARAGRAPH',
                nodes: [
                  {
                    type: 'TEXT',
                    textData: {
                      text: 'Bathrooms and kitchens often hold humidity naturally. A bright shelf near a window in either room is an easy win.',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'HEADING',
            headingData: { level: 2 },
            nodes: [{ type: 'TEXT', textData: { text: 'Signs you got it right' } }],
          },
          {
            type: 'PARAGRAPH',
            nodes: [
              {
                type: 'TEXT',
                textData: {
                  text: 'New leaves end in a swelling tendril that opens into a pitcher within a few weeks. Brown, crisp leaf tips mean the air is too dry — raise humidity and trim the damaged tips.',
                },
              },
            ],
          },
        ],
      },
    },
  ],
} satisfies DataCollection;
