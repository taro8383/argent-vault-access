import { WineItem } from "@/components/WineVault";

const STORAGE_KEY = "gc-wines-vault";

const defaultWines: WineItem[] = [
  {
    id: 1,
    name: "Gran Reserva Malbec",
    category: "The Elite Series",
    region: "Gualtallary, Uco Valley",
    altitude: "1,500m",
    score: "97",
    vintage: "2019",
    description: "Deep violet with layers of blackberry, violet, and crushed stone. A monument to altitude winemaking.",
    rationale: "Perfectly positioned for Singapore and Tokyo's Michelin-starred dining scene. Its mineral complexity speaks to sommeliers seeking authenticity.",
    winemaker: "Elena Morales · 4th Generation · Mendoza",
    color: "bg-burgundy",
  },
  {
    id: 2,
    name: "Corte Especial Blend",
    category: "The Balkan Powerhouses",
    region: "Altamira, Mendoza",
    altitude: "1,100m",
    score: "96",
    vintage: "2020",
    description: "A bold Malbec-Cabernet Franc blend with notes of dark plum, espresso, and Mediterranean herbs.",
    rationale: "Built for the Adriatic coast's emerging luxury hospitality market. Bold enough for Montenegrin and Croatian fine dining.",
    winemaker: "Matías Castillo · Boutique Producer · Altamira",
    color: "bg-burgundy-light",
  },
  {
    id: 3,
    name: "Glaciar Pinot Noir",
    category: "Patagonian Purity",
    region: "Neuquén, Patagonia",
    altitude: "800m",
    score: "95",
    vintage: "2021",
    description: "Ethereal and precise. Wild strawberry, wet clay, and a finish that whispers of ancient glaciers.",
    rationale: "A sommelier's wine—ideal for Shanghai's growing Burgundy-obsessed clientele seeking New World alternatives.",
    winemaker: "Lucía Fernández · Pioneer of Patagonian Pinot",
    color: "bg-charcoal-lighter",
  },
  {
    id: 4,
    name: "Altitude Reserve Cabernet",
    category: "The Elite Series",
    region: "Gualtallary, Uco Valley",
    altitude: "1,450m",
    score: "96",
    vintage: "2018",
    description: "Structured and commanding. Cassis, graphite, and a backbone forged in extreme altitude conditions.",
    rationale: "Designed for Japan's precision-driven wine market. Its structure and aging potential align with long-term cellar programs.",
    winemaker: "Carlos Vega · High-Altitude Specialist",
    color: "bg-burgundy",
  },
  {
    id: 5,
    name: "Terroir Ancestral",
    category: "The Balkan Powerhouses",
    region: "Las Compuertas, Luján de Cuyo",
    altitude: "980m",
    score: "95",
    vintage: "2019",
    description: "Old-vine Malbec from centenarian vineyards. Dense, layered, and deeply historic.",
    rationale: "Perfect for Montenegro's heritage luxury segment—old-world soul from New World vineyards.",
    winemaker: "The Dominguez Family · 100+ Year Vineyards",
    color: "bg-charcoal-light",
  },
];

export function getWines(): WineItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultWines;
}

export function saveWines(wines: WineItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
}

export function resetWines() {
  localStorage.removeItem(STORAGE_KEY);
  return defaultWines;
}

export const WINE_COLORS = [
  { label: "Burgundy", value: "bg-burgundy" },
  { label: "Burgundy Light", value: "bg-burgundy-light" },
  { label: "Charcoal Light", value: "bg-charcoal-light" },
  { label: "Charcoal Lighter", value: "bg-charcoal-lighter" },
];

export const WINE_CATEGORIES = [
  "The Elite Series",
  "The Balkan Powerhouses",
  "Patagonian Purity",
];
