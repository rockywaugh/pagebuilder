import { isPlaceholderPageName } from "./config";
import type { FontMood, HeaderStyle, SectionType, SiteSpec, SiteTheme } from "./types";

export type PatternFamily =
  | "product"
  | "editorial"
  | "hospitality"
  | "food"
  | "studio"
  | "professional"
  | "commerce"
  | "wellness"
  | "civic"
  | "event";

export type MarketPattern = {
  id: string;
  name: string;
  family: PatternFamily;
  market: string;
  look: string;
  keywords: string[];
  headerStyle: HeaderStyle;
  font: FontMood;
  palette: Pick<SiteTheme, "bg" | "ink" | "accent" | "muted" | "mood">;
  cta: string;
  headline: (name: string) => string;
  sections: Array<{ type: SectionType; title: string; body: string }>;
};

function secs(
  rows: Array<[SectionType, string, string]>,
): MarketPattern["sections"] {
  return rows.map(([type, title, body]) => ({ type, title, body }));
}

/**
 * Professional site systems used on the market. These are layout/type/color
 * recipes, not copies of any one company's page.
 */
export const MARKET_PATTERNS: MarketPattern[] = [
  {
    id: "product-saas",
    name: "SaaS product",
    family: "product",
    market: "B2B software marketing pages",
    look: "Near-white ground, black type, one accent, quiet bar, feature grid.",
    keywords: ["saas", "software", "app", "product", "startup", "platform", "tool", "b2b"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#f7f7f5", ink: "#111111", accent: "#1f6feb", muted: "#6b6b66", mood: "product" },
    cta: "Get started",
    headline: (name) => `${name} for teams that ship`,
    sections: secs([
      ["story", "The problem", "A short statement of the work this product takes off someone's plate."],
      ["features", "What it does", "Three concrete capabilities. No slogans."],
      ["visit", "Talk to us", "A calm path to a demo or a waitlist."],
    ]),
  },
  {
    id: "product-fintech",
    name: "Fintech",
    family: "product",
    market: "Payments and financial product pages",
    look: "Cool navy type, one electric accent, split banner, dense but clean.",
    keywords: ["fintech", "payments", "banking", "checkout", "wallet", "finance", "ledger"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#f4f6fb", ink: "#0b1f3a", accent: "#635bff", muted: "#5c6b80", mood: "fintech" },
    cta: "See how it works",
    headline: (name) => `Money movement, quietly handled by ${name}`,
    sections: secs([
      ["story", "Infrastructure", "What sits under the product, in plain language."],
      ["features", "Capabilities", "Accept, send, reconcile — named as the customer would say them."],
      ["visit", "Start", "A single next step for a business, not a consumer signup wall."],
    ]),
  },
  {
    id: "product-developer",
    name: "Developer tool",
    family: "product",
    market: "Developer-tool and infrastructure pages",
    look: "Dark ground, bone type, small wordmark, documentation-like sections.",
    keywords: ["developer", "docs", "api", "sdk", "infrastructure", "cloud", "devops", "code"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#0e1014", ink: "#ece7dc", accent: "#3dd68c", muted: "#8a8f99", mood: "night" },
    cta: "Read the docs",
    headline: (name) => `${name} in your terminal`,
    sections: secs([
      ["story", "Why it exists", "The job a developer was already doing by hand."],
      ["features", "Surface", "Install, configure, observe."],
      ["visit", "Install", "One command and a link to reference."],
    ]),
  },
  {
    id: "editorial-magazine",
    name: "Magazine",
    family: "editorial",
    market: "Editorial and magazine front pages",
    look: "Ivory paper, serif headline, thin rule, caption under the fold.",
    keywords: ["magazine", "editorial", "journal", "news", "essay", "publisher", "press"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#f3eadc", ink: "#1c1712", accent: "#c45c26", muted: "#8a7d6d", mood: "paper" },
    cta: "Read on",
    headline: (name) => `${name} this week`,
    sections: secs([
      ["story", "Letter", "A short editor's note."],
      ["quote", "From the issue", "One line that earns the rest of the page."],
      ["visit", "Subscribe", "How to receive the next one."],
    ]),
  },
  {
    id: "editorial-museum",
    name: "Museum",
    family: "editorial",
    market: "Museums, galleries, and cultural institutions",
    look: "Charcoal field, bone type, muted gold, editorial stack.",
    keywords: ["museum", "gallery", "exhibition", "art", "collection", "institution", "culture"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#141210", ink: "#efe6d6", accent: "#c4a46a", muted: "#6b6458", mood: "night" },
    cta: "Plan a visit",
    headline: (name) => `Now on view at ${name}`,
    sections: secs([
      ["story", "The exhibition", "What is hanging, and for how long."],
      ["gallery", "In the rooms", "Photographs of the space, not stock art."],
      ["visit", "Hours", "When the doors are open."],
    ]),
  },
  {
    id: "hospitality-hotel",
    name: "Hotel",
    family: "hospitality",
    market: "Luxury and city hotel pages",
    look: "Mist ground, navy type, sea-glass accent, centered masthead.",
    keywords: ["hotel", "stay", "suite", "concierge", "city hotel", "hospitality"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#e7eef2", ink: "#1c2a36", accent: "#3f7a73", muted: "#7d8b94", mood: "coast" },
    cta: "Reserve",
    headline: (name) => `A night at ${name}`,
    sections: secs([
      ["story", "The house", "Where it sits, and how it is kept."],
      ["features", "Rooms", "A few room types, named plainly."],
      ["visit", "Arrive", "Address, and how to book."],
    ]),
  },
  {
    id: "hospitality-inn",
    name: "Inn",
    family: "hospitality",
    market: "Boutique inns and countryside stays",
    look: "Sun-bleached sand, warm serif, editorial opening.",
    keywords: ["inn", "bed and breakfast", "guesthouse", "countryside", "retreat", "lodge"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#f4ead6", ink: "#2b2216", accent: "#b07a3a", muted: "#8b7b62", mood: "sand" },
    cta: "Request a date",
    headline: (name) => `Stay a night at ${name}`,
    sections: secs([
      ["story", "The place", "What you hear in the morning."],
      ["features", "The stay", "Rooms, breakfast, the walk."],
      ["visit", "Find us", "A road, not a pin dump."],
    ]),
  },
  {
    id: "food-restaurant",
    name: "Restaurant",
    family: "food",
    market: "Fine dining and neighborhood restaurants",
    look: "Kiln clay, serif, centered masthead, one button.",
    keywords: ["restaurant", "dining", "chef", "bistro", "supper", "table", "menu"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#f0ddd0", ink: "#2a1810", accent: "#c45c26", muted: "#8b6a58", mood: "kiln" },
    cta: "Reserve a table",
    headline: (name) => `A table at ${name}`,
    sections: secs([
      ["story", "The kitchen", "How the room is run."],
      ["features", "The menu", "A few dishes, not the whole card."],
      ["visit", "Hours", "When to come, and how to write."],
    ]),
  },
  {
    id: "food-cafe",
    name: "Cafe",
    family: "food",
    market: "Cafes, bakeries, and coffee rooms",
    look: "Linen paper, clay accent, editorial stack.",
    keywords: ["cafe", "coffee", "bakery", "bread", "pastry", "espresso", "neighborhood"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#f3eadc", ink: "#1c1712", accent: "#c45c26", muted: "#8a7d6d", mood: "paper" },
    cta: "See hours",
    headline: (name) => `${name} opens before the street does`,
    sections: secs([
      ["story", "The counter", "What is baked, and when."],
      ["features", "On the board", "Coffee, bread, a few things to take home."],
      ["visit", "The door", "Street, hours, a note about seating."],
    ]),
  },
  {
    id: "food-wine",
    name: "Winery",
    family: "food",
    market: "Wineries and tasting rooms",
    look: "Deep burgundy accent on bone paper, serif, centered.",
    keywords: ["winery", "wine", "vineyard", "tasting", "cellar", "vintage"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#f6efe6", ink: "#2a1218", accent: "#7a2433", muted: "#8a706c", mood: "cellar" },
    cta: "Book a tasting",
    headline: (name) => `Taste at ${name}`,
    sections: secs([
      ["story", "The land", "Where the fruit is grown."],
      ["features", "The wines", "A short list, not a catalog."],
      ["visit", "The room", "When tastings are held."],
    ]),
  },
  {
    id: "studio-architecture",
    name: "Architecture",
    family: "studio",
    market: "Architecture and interior studios",
    look: "White field, black type, split banner, sans.",
    keywords: ["architecture", "architect", "interior", "building", "practice", "design studio"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#f5f4f1", ink: "#161616", accent: "#3a3a3a", muted: "#7a7a74", mood: "studio" },
    cta: "View work",
    headline: (name) => `Work by ${name}`,
    sections: secs([
      ["story", "The studio", "How the practice is organized."],
      ["gallery", "Selected work", "A few buildings, named."],
      ["visit", "Office", "Where to write."],
    ]),
  },
  {
    id: "studio-craft",
    name: "Craft studio",
    family: "studio",
    market: "Makers, pottery, and craft workshops",
    look: "Fired earth, serif, editorial opening.",
    keywords: ["pottery", "ceramic", "craft", "workshop", "maker", "handmade", "studio"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#f0ddd0", ink: "#2a1810", accent: "#c45c26", muted: "#8b6a58", mood: "kiln" },
    cta: "See the work",
    headline: (name) => `Made by hand at ${name}`,
    sections: secs([
      ["story", "The bench", "How a piece is made."],
      ["gallery", "From the kiln", "Photographs of finished work."],
      ["visit", "Shop", "Hours, or how to order."],
    ]),
  },
  {
    id: "studio-photo",
    name: "Photography",
    family: "studio",
    market: "Photographer and portfolio pages",
    look: "Dark ground, small type, quiet bar, gallery-first.",
    keywords: ["photographer", "portfolio", "photography", "film", "portrait", "lookbook"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#121212", ink: "#f2eee6", accent: "#d8d0c4", muted: "#8a8680", mood: "night" },
    cta: "Inquire",
    headline: (name) => `${name}`,
    sections: secs([
      ["gallery", "Selected pictures", "The work, without a sales paragraph."],
      ["story", "About", "A short bio."],
      ["visit", "Booking", "How to write."],
    ]),
  },
  {
    id: "professional-law",
    name: "Law firm",
    family: "professional",
    market: "Law firms and chambers",
    look: "Navy and bone, centered masthead, serif, restrained.",
    keywords: ["law", "lawyer", "attorney", "firm", "chambers", "counsel", "legal"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#f6f3ec", ink: "#1a2744", accent: "#8b6914", muted: "#6e7380", mood: "navy" },
    cta: "Contact",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The practice", "What matters are taken."],
      ["features", "Areas", "A short list of work."],
      ["visit", "Chambers", "Address and a way to write."],
    ]),
  },
  {
    id: "professional-consult",
    name: "Consultancy",
    family: "professional",
    market: "Consultancies and advisory practices",
    look: "Harbor slate, sans, split banner.",
    keywords: ["consulting", "consultancy", "advisory", "strategy", "practice", "clients"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#e7eef2", ink: "#1c2a36", accent: "#3f7a73", muted: "#7d8b94", mood: "coast" },
    cta: "Start a conversation",
    headline: (name) => `${name}, for work that needs care`,
    sections: secs([
      ["story", "How we work", "A method, not a manifesto."],
      ["features", "Engagements", "Three kinds of work you actually take."],
      ["visit", "Write", "A contact path for a serious inquiry."],
    ]),
  },
  {
    id: "professional-clinic",
    name: "Clinic",
    family: "professional",
    market: "Clinics and private practices",
    look: "Pale ground, teal accent, quiet bar, high clarity.",
    keywords: ["clinic", "doctor", "dental", "practice", "health", "patient", "medical"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#f3f7f6", ink: "#1c2f2c", accent: "#2a7a6e", muted: "#6d7f7b", mood: "clinic" },
    cta: "Book a visit",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "Care", "Who is seen, and how."],
      ["features", "Services", "A plain list."],
      ["visit", "Hours", "Address, hours, parking."],
    ]),
  },
  {
    id: "commerce-boutique",
    name: "Boutique",
    family: "commerce",
    market: "Fashion and boutique retail pages",
    look: "Bone and black, split banner, little decoration.",
    keywords: ["boutique", "fashion", "atelier", "label", "collection"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#f6f1ea", ink: "#161412", accent: "#1c1c1c", muted: "#7c756c", mood: "boutique" },
    cta: "Shop the collection",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The line", "What is made this season."],
      ["gallery", "Look", "Garments, not lifestyle filler."],
      ["visit", "The shop", "Where to find it, or how to order."],
    ]),
  },
  {
    id: "commerce-clothing",
    name: "Clothing",
    family: "commerce",
    market: "Apparel and clothing brand pages",
    look: "Clean shop, sans type, product grid, bag in the header.",
    keywords: ["clothing", "clothes", "apparel", "wear", "garment", "outfit", "wardrobe"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#f7f6f3", ink: "#141414", accent: "#c45c26", muted: "#7a756e", mood: "goods" },
    cta: "Shop now",
    headline: (name) => `${name}`,
    sections: secs([
      ["features", "This season", "A few pieces, named as they hang."],
      ["gallery", "The look", "Cloth, cut, and color — not a lifestyle dump."],
      ["visit", "The shop", "How to buy, and where the fitting room is."],
    ]),
  },
  {
    id: "commerce-goods",
    name: "Direct goods",
    family: "commerce",
    market: "Direct-to-consumer product pages",
    look: "Warm white, sans, feature trio, one accent.",
    keywords: ["shop", "store", "product", "goods", "commerce", "brand", "dtc"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#faf7f2", ink: "#1a1714", accent: "#c45c26", muted: "#7d7468", mood: "goods" },
    cta: "Shop",
    headline: (name) => `${name}, made to be used`,
    sections: secs([
      ["story", "Made how", "Materials and why they were chosen."],
      ["features", "The goods", "Three products, named."],
      ["visit", "Order", "How to buy."],
    ]),
  },
  {
    id: "wellness-spa",
    name: "Spa",
    family: "wellness",
    market: "Spas and wellness houses",
    look: "Sage ground, forest type, copper accent, serif.",
    keywords: ["spa", "wellness", "massage", "bath", "sauna", "treatment"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#e4eadc", ink: "#243026", accent: "#b5683a", muted: "#6d7a64", mood: "grove" },
    cta: "Book a treatment",
    headline: (name) => `Quiet hours at ${name}`,
    sections: secs([
      ["story", "The house", "What the visit is for."],
      ["features", "Treatments", "A short menu."],
      ["visit", "Arrive", "Hours and how to book."],
    ]),
  },
  {
    id: "wellness-fitness",
    name: "Studio fitness",
    family: "wellness",
    market: "Boutique fitness and movement studios",
    look: "High contrast, sans, split banner.",
    keywords: ["fitness", "gym", "yoga", "pilates", "training", "movement", "class"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#f4f2ee", ink: "#141414", accent: "#e23d28", muted: "#6f6b66", mood: "fitness" },
    cta: "See the schedule",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The room", "What kind of training happens here."],
      ["features", "Classes", "A few formats."],
      ["visit", "Join", "Schedule and membership."],
    ]),
  },
  {
    id: "civic-nonprofit",
    name: "Nonprofit",
    family: "civic",
    market: "Nonprofits and public-interest pages",
    look: "Open, accessible sans, clear hierarchy, one strong accent.",
    keywords: ["nonprofit", "charity", "foundation", "mission", "donate", "community"],
    headerStyle: "minimal",
    font: "sans",
    palette: { bg: "#f7f6f2", ink: "#1c2430", accent: "#c45c26", muted: "#6b7380", mood: "civic" },
    cta: "Give",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The work", "What is funded, in one paragraph."],
      ["features", "Programs", "A few named efforts."],
      ["visit", "Participate", "Give, volunteer, or write."],
    ]),
  },
  {
    id: "civic-university",
    name: "University",
    family: "civic",
    market: "Schools and university landing pages",
    look: "Crest-like navy and gold, serif, centered.",
    keywords: ["university", "college", "school", "campus", "academy", "education"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#f4efe4", ink: "#1a2744", accent: "#8b6914", muted: "#6e6a60", mood: "campus" },
    cta: "Visit campus",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The school", "Who it is for."],
      ["features", "Programs", "A short academic list."],
      ["visit", "Admissions", "How to apply or visit."],
    ]),
  },
  {
    id: "event-conference",
    name: "Conference",
    family: "event",
    market: "Conferences and professional gatherings",
    look: "Bold accent, sans, split, date-forward.",
    keywords: ["conference", "summit", "meetup", "talks", "agenda", "tickets"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#f6f5f1", ink: "#141414", accent: "#1f6feb", muted: "#6b6b66", mood: "event" },
    cta: "Get a ticket",
    headline: (name) => `${name} is this season`,
    sections: secs([
      ["story", "Why gather", "What the day is for."],
      ["features", "The day", "When it starts, who speaks, where."],
      ["visit", "Attend", "Tickets and the address."],
    ]),
  },
  {
    id: "event-wedding",
    name: "Wedding",
    family: "event",
    market: "Weddings and celebration pages",
    look: "Cream paper, serif, centered masthead.",
    keywords: ["wedding", "celebration", "invitation", "ceremony", "reception"],
    headerStyle: "centered",
    font: "serif",
    palette: { bg: "#f6efe6", ink: "#2a2218", accent: "#8b6914", muted: "#8a7d6d", mood: "paper" },
    cta: "RSVP",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The day", "When and where."],
      ["features", "Schedule", "Ceremony, meal, the rest."],
      ["visit", "Reply", "How to RSVP."],
    ]),
  },
  {
    id: "commerce-property",
    name: "Property",
    family: "commerce",
    market: "Real estate and property pages",
    look: "Photography-led split, sans, cool slate.",
    keywords: ["real estate", "property", "listing", "home", "apartment", "realtor", "broker"],
    headerStyle: "split",
    font: "sans",
    palette: { bg: "#eef1f4", ink: "#1c2430", accent: "#3f7a73", muted: "#6d7782", mood: "property" },
    cta: "Request a showing",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The property", "What it is, and where."],
      ["gallery", "Rooms", "Photographs of the place."],
      ["visit", "Inquire", "How to see it."],
    ]),
  },
  {
    id: "professional-wealth",
    name: "Advisory",
    family: "professional",
    market: "Wealth and private advisory pages",
    look: "Deep navy, muted gold, editorial stack.",
    keywords: ["wealth", "private bank", "family office", "investment", "advisory", "capital"],
    headerStyle: "editorial",
    font: "serif",
    palette: { bg: "#10151c", ink: "#efe6d6", accent: "#c4a46a", muted: "#7a7468", mood: "night" },
    cta: "Request a conversation",
    headline: (name) => `${name}`,
    sections: secs([
      ["story", "The desk", "Who is advised, and how."],
      ["features", "Services", "A short, sober list."],
      ["visit", "Confidential inquiry", "A private path to write."],
    ]),
  },
];

export type MarketMood = {
  id: string;
  name: string;
  look: string;
  palette: Pick<SiteTheme, "bg" | "ink" | "accent" | "muted" | "mood">;
};

export const MARKET_MOODS: MarketMood[] = [
  {
    id: "warm-paper",
    name: "Warm and paper-like",
    look: "Ivory ground, brown ink, a clay accent — like letterpress on stock.",
    palette: { bg: "#f3eadc", ink: "#1c1712", accent: "#c45c26", muted: "#8a7d6d", mood: "paper" },
  },
  {
    id: "dark-gallery",
    name: "Dark gallery",
    look: "Charcoal field, bone type, muted gold. Quiet rooms after hours.",
    palette: { bg: "#141210", ink: "#efe6d6", accent: "#c4a46a", muted: "#6b6458", mood: "night" },
  },
  {
    id: "coastal",
    name: "Coastal",
    look: "Mist ground, navy type, sea-glass accent. Air and water.",
    palette: { bg: "#e7eef2", ink: "#1c2a36", accent: "#3f7a73", muted: "#7d8b94", mood: "coast" },
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    look: "Sage ground, forest type, copper accent. Plants and quiet hours.",
    palette: { bg: "#e4eadc", ink: "#243026", accent: "#b5683a", muted: "#6d7a64", mood: "grove" },
  },
  {
    id: "cool-product",
    name: "Cool and precise",
    look: "Near-white, black type, one blue accent. Software-clean.",
    palette: { bg: "#f7f7f5", ink: "#111111", accent: "#1f6feb", muted: "#6b6b66", mood: "product" },
  },
  {
    id: "quiet-navy",
    name: "Quiet navy",
    look: "Bone paper, navy ink, restrained gold. Chambers and desks.",
    palette: { bg: "#f6f3ec", ink: "#1a2744", accent: "#8b6914", muted: "#6e7380", mood: "navy" },
  },
  {
    id: "soft-spa",
    name: "Soft spa",
    look: "Pale mint, teal accent, high clarity. Calm without being vague.",
    palette: { bg: "#f3f7f6", ink: "#1c2f2c", accent: "#2a7a6e", muted: "#6d7f7b", mood: "clinic" },
  },
  {
    id: "kiln",
    name: "Kiln and clay",
    look: "Fired earth, dark brown type, kiln-orange accent. Rooms that cook.",
    palette: { bg: "#f0ddd0", ink: "#2a1810", accent: "#c45c26", muted: "#8b6a58", mood: "kiln" },
  },
];

export function moodById(id: string | undefined): MarketMood | undefined {
  if (!id) return undefined;
  return MARKET_MOODS.find((item) => item.id === id);
}

function hexDistance(a: string, b: string) {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ] as const;
  };
  const left = parse(a);
  const right = parse(b);
  return (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2;
}

export function defaultMoodForPattern(pattern: MarketPattern): MarketMood {
  const exact = MARKET_MOODS.find(
    (mood) =>
      mood.palette.bg === pattern.palette.bg &&
      mood.palette.ink === pattern.palette.ink &&
      mood.palette.accent === pattern.palette.accent,
  );
  if (exact) return exact;
  const named = MARKET_MOODS.find((mood) => mood.palette.mood === pattern.palette.mood);
  if (named) return named;
  return MARKET_MOODS.reduce((best, mood) => {
    const next =
      hexDistance(mood.palette.bg, pattern.palette.bg) +
      hexDistance(mood.palette.ink, pattern.palette.ink) +
      hexDistance(mood.palette.accent, pattern.palette.accent);
    const current =
      hexDistance(best.palette.bg, pattern.palette.bg) +
      hexDistance(best.palette.ink, pattern.palette.ink) +
      hexDistance(best.palette.accent, pattern.palette.accent);
    return next < current ? mood : best;
  });
}

export type PatternMatch = {
  pattern: MarketPattern;
  score: number;
  alternates: MarketPattern[];
};

export function patternById(id: string | undefined): MarketPattern | undefined {
  if (!id) return undefined;
  return MARKET_PATTERNS.find((item) => item.id === id);
}

const FAMILY_TABS: Record<PatternFamily, string[]> = {
  product: ["Product", "Pricing", "About"],
  editorial: ["Stories", "Visit", "About"],
  hospitality: ["Stay", "Rooms", "About"],
  food: ["Menu", "Hours", "About"],
  studio: ["Work", "About", "Contact"],
  professional: ["Practice", "People", "Contact"],
  commerce: ["Shop", "About", "Visit"],
  wellness: ["Services", "About", "Book"],
  civic: ["About", "Programs", "Contact"],
  event: ["Schedule", "About", "Tickets"],
};

const TABS_BY_ID: Record<string, string[]> = {
  "product-saas": ["Product", "Pricing", "Docs"],
  "product-developer": ["Product", "Docs", "Changelog"],
  "editorial-magazine": ["Features", "Archive", "Subscribe"],
  "editorial-museum": ["Exhibitions", "Visit", "About"],
  "food-restaurant": ["Menu", "Reserve", "Hours"],
  "food-wine": ["Wines", "Visit", "Shop"],
  "studio-photo": ["Work", "About", "Contact"],
  "commerce-clothing": ["New", "Women", "Men"],
  "commerce-boutique": ["Shop", "Look", "Visit"],
  "wellness-spa": ["Treatments", "About", "Book"],
  "wellness-fitness": ["Classes", "Membership", "About"],
  "civic-nonprofit": ["Mission", "Programs", "Give"],
  "civic-university": ["Academics", "Campus", "Apply"],
  "event-conference": ["Speakers", "Schedule", "Tickets"],
  "event-wedding": ["Schedule", "Travel", "RSVP"],
};

const CHECKOUT_IDS = new Set([
  "commerce-boutique",
  "commerce-clothing",
  "commerce-goods",
  "commerce-property",
  "food-wine",
  "event-conference",
  "studio-craft",
]);

export function patternChrome(pattern: MarketPattern): {
  tabs: string[];
  showLogin: boolean;
  showCheckout: boolean;
} {
  return {
    tabs: TABS_BY_ID[pattern.id] ?? FAMILY_TABS[pattern.family],
    showLogin: pattern.id !== "event-wedding",
    showCheckout: CHECKOUT_IDS.has(pattern.id),
  };
}

export function scorePattern(pattern: MarketPattern, text: string): number {
  const hay = text.toLowerCase();
  return pattern.keywords.reduce((sum, key) => (hay.includes(key) ? sum + (key.includes(" ") ? 2 : 1) : sum), 0);
}

export function matchPattern(text: string): PatternMatch {
  const ranked = MARKET_PATTERNS.map((pattern) => ({
    pattern,
    score: scorePattern(pattern, text),
  })).sort((a, b) => b.score - a.score);

  const top = ranked[0] ?? { pattern: MARKET_PATTERNS[0], score: 0 };
  const alternates = ranked
    .filter((row) => row.pattern.id !== top.pattern.id)
    .slice(0, 3)
    .map((row) => row.pattern);

  return { ...top, alternates };
}

export function applyPattern(spec: SiteSpec, pattern: MarketPattern): SiteSpec {
  const named = isPlaceholderPageName(spec.name) ? pattern.name : spec.name;
  const chrome = patternChrome(pattern);
  return {
    ...spec,
    purpose: pattern.name,
    patternId: pattern.id,
    navTabs: chrome.tabs,
    showLogin: chrome.showLogin,
    showCheckout: chrome.showCheckout,
    theme: {
      mood: pattern.palette.mood,
      bg: pattern.palette.bg,
      ink: pattern.palette.ink,
      accent: pattern.palette.accent,
      muted: pattern.palette.muted,
      font: pattern.font,
      headerStyle: pattern.headerStyle,
      ruleWeight: spec.theme.ruleWeight ?? 1,
    },
    hero: {
      ...spec.hero,
      headline: pattern.headline(named),
      cta: pattern.cta,
    },
    sections: pattern.sections.map((section, index) => ({
      id: spec.sections[index]?.id || `sec_${pattern.id}_${index}`,
      type: section.type,
      title: section.title,
      body: section.body,
      imageId: spec.sections[index]?.imageId || spec.backgroundAssetId,
    })),
  };
}

export function applyPatternPalette(spec: SiteSpec, pattern: MarketPattern): SiteSpec {
  return {
    ...spec,
    theme: {
      ...spec.theme,
      mood: pattern.palette.mood,
      bg: pattern.palette.bg,
      ink: pattern.palette.ink,
      accent: pattern.palette.accent,
      muted: pattern.palette.muted,
      font: pattern.font,
      headerStyle: pattern.headerStyle,
    },
  };
}

export function applyMood(spec: SiteSpec, mood: MarketMood): SiteSpec {
  return {
    ...spec,
    moodId: mood.id,
    theme: {
      ...spec.theme,
      mood: mood.palette.mood,
      bg: mood.palette.bg,
      ink: mood.palette.ink,
      accent: mood.palette.accent,
      muted: mood.palette.muted,
    },
  };
}

export function publicCatalog() {
  return MARKET_PATTERNS.map((pattern) => ({
    id: pattern.id,
    name: pattern.name,
    family: pattern.family,
    market: pattern.market,
    look: pattern.look,
    headerStyle: pattern.headerStyle,
    font: pattern.font,
    swatches: [pattern.palette.bg, pattern.palette.ink, pattern.palette.accent, pattern.palette.muted],
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function publicMoods() {
  return MARKET_MOODS.map((mood) => ({
    id: mood.id,
    name: mood.name,
    look: mood.look,
    swatches: [mood.palette.bg, mood.palette.ink, mood.palette.accent, mood.palette.muted],
  }));
}

export type MarketFont = {
  id: string;
  name: string;
  look: string;
  mood: FontMood;
  stack: string;
};

export const MARKET_FONTS: MarketFont[] = [
  {
    id: "figtree",
    name: "Figtree",
    look: "Clean geometric sans. Product and studio pages.",
    mood: "sans",
    stack: "Figtree, Helvetica Neue, Helvetica, sans-serif",
  },
  {
    id: "helvetica",
    name: "Helvetica Neue",
    look: "Neutral Swiss sans. Law, finance, architecture.",
    mood: "sans",
    stack: "Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    look: "Modern product sans used across software pages.",
    mood: "sans",
    stack: "Inter, Figtree, Helvetica Neue, sans-serif",
  },
  {
    id: "avenir",
    name: "Avenir",
    look: "Soft geometric sans. Hospitality and wellness.",
    mood: "sans",
    stack: "Avenir Next, Avenir, Gill Sans, sans-serif",
  },
  {
    id: "gill-sans",
    name: "Gill Sans",
    look: "Humanist sans. Museums, universities, civic pages.",
    mood: "sans",
    stack: "Gill Sans, Gill Sans MT, Helvetica, sans-serif",
  },
  {
    id: "newsreader",
    name: "Newsreader",
    look: "Editorial serif. Magazines, inns, restaurants.",
    mood: "serif",
    stack: "Newsreader, Georgia, serif",
  },
  {
    id: "georgia",
    name: "Georgia",
    look: "Warm screen serif. Hotels, firms, and stories.",
    mood: "serif",
    stack: "Georgia, Times New Roman, serif",
  },
  {
    id: "palatino",
    name: "Palatino",
    look: "Bookish serif. Wineries, universities, chambers.",
    mood: "serif",
    stack: "Palatino, Palatino Linotype, Book Antiqua, serif",
  },
  {
    id: "didot",
    name: "Didot",
    look: "High-contrast display. Fashion, galleries, editorials.",
    mood: "display",
    stack: "Didot, Bodoni 72, Times, serif",
  },
];

export function fontById(id: string | undefined): MarketFont | undefined {
  if (!id) return undefined;
  return MARKET_FONTS.find((item) => item.id === id);
}

export function defaultFontForPattern(pattern: MarketPattern): MarketFont {
  return MARKET_FONTS.find((font) => font.mood === pattern.font) ?? MARKET_FONTS[0];
}

export function applyFont(spec: SiteSpec, font: MarketFont): SiteSpec {
  return {
    ...spec,
    fontId: font.id,
    theme: {
      ...spec.theme,
      font: font.mood,
    },
  };
}

export function publicFonts() {
  return MARKET_FONTS.map((font) => ({
    id: font.id,
    name: font.name,
    look: font.look,
    stack: font.stack,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogHintNames(): string[] {
  return [
    "SaaS product site",
    "Restaurant",
    "Hotel",
    "Law firm",
    "Photography portfolio",
    "Spa",
  ];
}

export function nearestPatternNames(text: string): string[] {
  return matchPattern(text).alternates.map((item) => item.name);
}
