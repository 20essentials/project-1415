import inicioPoster from '../assets/world/v1.webp';
import instinctPoster from '../assets/world/v2.webp';
import collectionPoster from '../assets/world/v3.webp';
import proofPoster from '../assets/world/v4.webp';
import carePoster from '../assets/world/v5.webp';
import tuCasaPoster from '../assets/world/tu-casa.webp';

export const site = {
  seo: {
    title: 'Petals & Predators — Carnivorous plants and flowers',
    description:
      'Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.',
  },
  nav: [
    { href: '#inicio', label: 'Home' },
    { href: '#collection', label: 'Collection' },
    { href: '#care', label: 'Care' },
    { href: '/products', label: 'Shop' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  links: {
    shop: '/products',
    collection: '#collection',
  },
  paseo: {
    stops: [
      {
        id: 'inicio',
        poster: inicioPoster,
        clip: '/videos/v1.mp4',
        focus: 70,
        title: 'Plants with teeth.',
        subtitle:
          'Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.',
        cta: { href: '/products', label: 'Shop the collection' },
        pills: ['greenhouse-grown', 'shipped alive', 'care guide'],
      },
      {
        id: 'instinct',
        poster: instinctPoster,
        clip: '/videos/v2.mp4',
        focus: 60,
        title: 'Instinct in every trap.',
        subtitle: 'Nature evolved these plants to capture what they need. We grow them with care and ship them alive.',
        bullets: [
          'Carnivorous — they catch insects to thrive',
          'Low-maintenance when given the right light & water',
          'A living conversation starter for any space',
        ],
      },
      {
        id: 'collection',
        poster: collectionPoster,
        clip: '/videos/v3.mp4',
        focus: 55,
        title: 'The collection.',
        subtitle: 'A curated selection of carnivorous plants and flowers, grown by hand.',
        bullets: [
          'Venus Flytrap, Nepenthes, Cape Sundew, Moonlight Orchid',
          'Starter Kit for those just getting started',
          'Care-tested for first-time growers',
        ],
      },
      {
        id: 'proof',
        poster: proofPoster,
        clip: '/videos/v4.mp4',
        focus: 55,
        title: 'Proof in every order.',
        subtitle: 'What matters most: they arrive alive and ready to grow.',
        bullets: [
          'greenhouse-grown',
          'shipped alive',
          '30-day arrival guarantee',
        ],
      },
      {
        id: 'care',
        poster: carePoster,
        clip: '/videos/v5.mp4',
        focus: 55,
        title: 'Care made simple.',
        subtitle: "We don't just ship you a plant — we set you up to keep it thriving.",
        bullets: [
          'Care guide included with every order',
          'Choose — Arrives alive — Grow with our guide',
          'No green thumb required',
        ],
      },
      {
        id: 'tu-casa',
        poster: tuCasaPoster,
        focus: 50,
        title: 'Bring one home.',
        subtitle: 'Pick a plant and watch it come alive in your space.',
        cta: { href: '/products', label: 'Shop the collection' },
      },
    ],
  },
  faqs: [
    {
      question: 'Will my plant arrive alive?',
      answer: 'Yes. We ship greenhouse-grown plants carefully packed and guarantee live arrival.',
    },
    {
      question: 'What do carnivorous plants eat?',
      answer: 'They catch small insects naturally. Indoors, they often catch enough on their own — no feeding required.',
    },
    {
      question: 'Do I need a green thumb?',
      answer: "No. Each order includes a care guide covering light, water, and humidity — it's easier than you think.",
    },
    {
      question: 'Which plant should I choose as a beginner?',
      answer: 'Our Starter Kit is perfect for first-time growers. Venus Flytrap and Cape Sundew are also great options.',
    },
    {
      question: 'Do you offer shipping and returns info?',
      answer: 'See Shipping & Returns in our Contact page for the latest details.',
    },
  ],
} as const;
