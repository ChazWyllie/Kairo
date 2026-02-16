/* ======================================================
   Kairo — Page Registry
   Single source of truth for all showcase landing pages.
   Add a new page? Just add an entry here.
   ====================================================== */

const PAGE_REGISTRY = [
  {
    slug: 'v1-momentum',
    name: 'Momentum',
    version: 'V1',
    description: 'Stats-forward social proof. Split hero with 2×2 stat cards, trust bar, and horizontal timeline steps.',
    tags: ['stats', 'social-proof', 'split-hero', 'timeline'],
    file: 'pages/v1-momentum.html',
    cssClass: 'sc-tag-momentum',
    previewClass: 'sc-preview-momentum'
  },
  {
    slug: 'v2-nightfall',
    name: 'Nightfall',
    version: 'V2',
    description: 'Cinematic editorial. Full-bleed hero with oversized type, alternating feature sections with large number labels.',
    tags: ['cinematic', 'editorial', 'full-bleed', 'alternating'],
    file: 'pages/v2-nightfall.html',
    cssClass: 'sc-tag-nightfall',
    previewClass: 'sc-preview-nightfall'
  },
  {
    slug: 'v3-pulse',
    name: 'Pulse',
    version: 'V3',
    description: 'Linear/Stripe-inspired minimal. Centered tagline hero, horizontal feature strip, clean stats bar.',
    tags: ['minimal', 'stripe', 'centered', 'horizontal-scroll'],
    file: 'pages/v3-pulse.html',
    cssClass: 'sc-tag-pulse',
    previewClass: 'sc-preview-pulse'
  }
];

// All unique tags for filter pills
const ALL_TAGS = [...new Set(PAGE_REGISTRY.flatMap(p => p.tags))].sort();
