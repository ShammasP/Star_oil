/* ==========================================================
   Star Pure Coconut Oil: product catalogue & business details
   Edit text, colours and photos here; every page reads from this file.
   ========================================================== */

window.SITE = {
  company: 'Bismi Traders',
  proprietor: 'NK Mohammed Shareef',
  address: 'House No. 145, Salmas, Near Juma Masjid, Muttam Vengara, Kannur, Kerala 670305',
  whatsapp: '910000000000',          // country code + number, digits only (e.g. 919876543210)
  phoneDisplay: '+91 00000 00000',
  instagram: '#',
  facebook: '#',
};

window.PRODUCTS = [
  {
    id: '5l-can',
    name: '5 Litre Can',
    kicker: 'Family pack',
    title: ['FIVE', 'GOLD'], script: 'litres of',
    tagline: 'Our biggest can, for big families and busy kitchens',
    note: 'Comes in classic yellow and clear cans',
    desc: 'For kitchens that cook all day. The 5 litre can keeps a big family, a restaurant or a caterer stocked with the same pure, golden Star oil, batch after batch.',
    details: [['5 L', 'Pack size'], ['Yellow & clear', 'Can colours'], ['Homes & hotels', 'Best for']],
    theme: { bg: '#f6c62e', bg2: '#fbdc6a', fg: '#3a2306' },
    art: { sym: 'ico-jar', body: '#f6c419', cap: '#f6c419', oil: '#f0a51c', scale: 1 },
    img: 'assets/images/products/5l-can.png',
  },
  {
    id: '2l-bottle',
    name: '2 Litre Bottle',
    kicker: 'Kitchen favourite',
    title: ['KITCHEN', 'HERO'], script: 'everyday',
    tagline: 'The easy-pour bottle for everyday cooking',
    note: 'Easy-grip handle with a red seal cap',
    desc: 'Big enough for a week of curries, fries and payasam, and light enough to pour with one hand. Our most popular bottle in Kerala kitchens.',
    details: [['2 L', 'Pack size'], ['Easy-grip', 'Handle'], ['Daily cooking', 'Best for']],
    theme: { bg: '#cfe7ae', bg2: '#e2f2cc', fg: '#1f3a10' },
    art: { sym: 'ico-bottle', body: '#fbf3dc', cap: '#d8262f', oil: '#f2c654', scale: 1 },
    img: 'assets/images/products/2l-bottle.png',
  },
  {
    id: '1l-bottle',
    name: '1 Litre Bottle',
    kicker: 'Everyday',
    title: ['POUR', 'PURE'], script: 'a little',
    tagline: 'Compact, handy and good for kitchen, hair and skin',
    note: 'Handy size with a red seal cap',
    desc: 'A compact bottle that sits by the stove and fits in the bathroom cupboard. Use it to cook, for an oil massage, or as a hair treatment the way grandmother did.',
    details: [['1 L', 'Pack size'], ['Kitchen & care', 'Use'], ['Small homes', 'Best for']],
    theme: { bg: '#f4e4c4', bg2: '#fbf1dc', fg: '#4a2a0e' },
    art: { sym: 'ico-bottle', body: '#fbf3dc', cap: '#d8262f', oil: '#f2c654', scale: 0.86 },
    img: 'assets/images/products/1l-bottle.png',
  },
  {
    id: '1l-pouch',
    name: '1 Litre Pouch',
    kicker: 'Carton of 10',
    title: ['REFILL', 'SMART'], script: '& save',
    tagline: 'An economical refill pouch, packed 10 to a carton',
    note: 'For shops and distributors',
    desc: 'The same Star oil in a light, sealed pouch. Refill your bottle at home, or stock cartons of ten in your shop for customers who buy every week.',
    details: [['1 L', 'Pouch'], ['10 pouches', 'Per carton'], ['Shops & refills', 'Best for']],
    theme: { bg: '#e6c69c', bg2: '#f1dbbb', fg: '#3b2208' },
    art: { sym: 'ico-pouch', oil: '#f2c654', scale: 1 },
    img: 'assets/images/products/1l-pouch.png',
  },
  {
    id: '500ml-pouch',
    name: '500 ml Pouch',
    kicker: 'Carton of 20',
    title: ['SMALL', 'MIGHTY'], script: 'but',
    tagline: 'Our smallest and most affordable pack',
    note: 'Packed 20 to a carton',
    desc: 'A good first taste of Star, and a pack every corner shop can stock. It holds the same golden oil as our big cans in a pocket-friendly size.',
    details: [['500 ml', 'Pouch'], ['20 pouches', 'Per carton'], ['First try', 'Best for']],
    theme: { bg: '#f4ad9e', bg2: '#f9c9bd', fg: '#4a140f' },
    art: { sym: 'ico-pouch', oil: '#f2c654', scale: 0.82 },
    img: 'assets/images/products/500ml-pouch.png',
  },
];
