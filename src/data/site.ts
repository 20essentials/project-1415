export const site = {
  seo: {
    title: 'Petals & Predators — Carnivorous plants and flowers',
    description:
      'Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.',
  },
  nav: [
    { href: '#inicio', label: 'Home' },
    { href: '#instinct', label: 'Instinct' },
    { href: '#collection', label: 'Collection' },
    { href: '#proof', label: 'Proof' },
    { href: '#care', label: 'Care' },
    { href: '#como-funciona', label: 'How it works' },
    { href: '#tu-casa', label: 'Your space' },
    { href: '/products', label: 'All plants' },
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
        label: 'Home',
        eyebrow: 'Petals & Predators',
        title: 'Plants with teeth.',
        subtitle:
          'Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.',
        poster: '/world/inicio.webp',
        focus: 50,
        claims: ['greenhouse-grown', 'shipped alive', 'care guide'],
        cta: { href: '/products', label: 'Shop the collection' },
        scroll: 1.5,
        linger: 0.35,
      },
      {
        id: 'instinct',
        label: 'Instinct',
        eyebrow: 'Instinct',
        title: 'Nature built the trap.',
        subtitle:
          'Carnivorous plants evolved to catch insects — a quiet, patient hunt in a pot on your windowsill.',
        poster: '/world/instinct.webp',
        focus: 55,
        claims: ['Carnivorous', 'Low-maintenance', 'Conversation starter'],
      },
      {
        id: 'collection',
        label: 'Collection',
        eyebrow: 'The collection',
        title: 'Five plants, one standard.',
        subtitle:
          'Venus Flytrap $24 · Nepenthes $24–52 · Cape Sundew $18 · Moonlight Orchid $32 · Starter Kit $45. Care-tested for first-time growers.',
        poster: '/world/collection.webp',
        focus: 50,
        claims: ['Carnivorous', 'Orchids', 'Starter kits'],
      },
      {
        id: 'proof',
        label: 'Proof',
        eyebrow: 'Proof',
        title: 'Shipped alive, guaranteed.',
        subtitle: 'Greenhouse-grown, packed by hand, and protected by our 30-day arrival guarantee.',
        poster: '/world/proof.webp',
        focus: 50,
        claims: ['greenhouse-grown', 'shipped alive', '30-day guarantee'],
      },
      {
        id: 'care',
        label: 'Care',
        eyebrow: 'Care',
        title: 'No green thumb needed.',
        subtitle:
          'Every order includes a care guide covering light, water and humidity. We ship you the plant AND the confidence to keep it growing.',
        poster: '/world/care.webp',
        focus: 50,
        claims: ['care guide included', 'Starter Kit', 'low-maintenance'],
      },
      {
        id: 'como-funciona',
        label: 'How it works',
        eyebrow: 'How it works',
        title: 'From our greenhouse to your shelf.',
        subtitle: '',
        poster: '/world/como-funciona.webp',
        focus: 50,
        steps: ['Choose your plant', 'It arrives alive', 'Grow with the care guide'],
      },
      {
        id: 'tu-casa',
        label: 'Your space',
        eyebrow: 'Your space',
        title: 'Bring one home.',
        subtitle: 'Pick a plant, skip the guesswork, and watch it come alive in your space.',
        poster: '/world/tu-casa.webp',
        focus: 50,
        cta: { href: '/products', label: 'Shop the collection' },
        scroll: 1.4,
        linger: 0.3,
      },
    ],
  },
  faqs: [
    {
      question: 'Will my plant arrive alive?',
      answer:
        'Yes. We ship greenhouse-grown plants carefully packed and guarantee live arrival for 30 days.',
    },
    {
      question: 'What do carnivorous plants eat?',
      answer:
        'They catch small insects naturally. Indoors, they often catch enough on their own — no feeding required.',
    },
    {
      question: 'Do I need a green thumb?',
      answer:
        "No. Each order includes a care guide covering light, water, and humidity — it's easier than you think.",
    },
    {
      question: 'Which plant should I choose as a beginner?',
      answer:
        'Our Starter Kit is perfect for first-time growers. Venus Flytrap and Cape Sundew are also great options.',
    },
    {
      question: 'Shipping & returns?',
      answer:
        'We ship worldwide. If your plant does not arrive alive, contact us within 30 days and we will make it right.',
    },
  ],
} as const;
