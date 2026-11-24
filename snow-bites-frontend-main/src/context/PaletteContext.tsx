import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PaletteId = "charcoal-ember" | "warm-cream" | "burgundy-gold" | "forest-green";

export interface PaletteOption {
  id: PaletteId;
  number: number;
  name: string;
  nameEs: string;
  tagline: string;
  swatches: {
    bg: string;
    card: string;
    header: string;
    text: string;
    button: string;
    price: string;
  };
}

export const PALETTES: PaletteOption[] = [
  {
    id: "charcoal-ember",
    number: 2,
    name: "Charcoal Ember",
    nameEs: "Carbón y Brasa",
    tagline: "Dark neutral — no green on green. The lime K pops on charcoal, and ember orange buttons feel like fire and grill.",
    swatches: {
      bg: "#161210",
      card: "#241D18",
      header: "#0E0B09",
      text: "#F5F0E8",
      button: "#E8590C",
      price: "#F2C41C",
    },
  },
  {
    id: "warm-cream",
    number: 1,
    name: "Warm Cream",
    nameEs: "Crema Cálida",
    tagline: "Light and bright — dark green logo stands out on cream, and food photos look fresh. Best for a clean, friendly feel.",
    swatches: {
      bg: "#FBF6EE",
      card: "#FFFFFF",
      header: "#2B2118",
      text: "#241B12",
      button: "#C2410C",
      price: "#B45309",
    },
  },
  {
    id: "burgundy-gold",
    number: 3,
    name: "Burgundy & Gold",
    nameEs: "Borgoña y Dorado",
    tagline: "Classic restaurant colours — deep red sits opposite green on the colour wheel, so the logo stands out the most.",
    swatches: {
      bg: "#FAF4EC",
      card: "#FFFFFF",
      header: "#6B1F2A",
      text: "#2A1A1C",
      button: "#8C2B3A",
      price: "#8C6D1F",
    },
  },
  {
    id: "forest-green",
    number: 4,
    name: "Forest Green",
    nameEs: "Verde Bosque",
    tagline: "Original logo palette — deep night green background with forest green cards and gold highlights.",
    swatches: {
      bg: "#071F07",
      card: "#0B3D0B",
      header: "#0B3D0B",
      text: "#F7F5EF",
      button: "#F2C41C",
      price: "#A0D000",
    },
  },
];

interface PaletteContextValue {
  palette: PaletteId;
  currentPalette: PaletteOption;
  setPalette: (id: PaletteId) => void;
  palettes: PaletteOption[];
}

const STORAGE_KEY = "kabob_place_palette";

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as PaletteId | null;
      if (saved && PALETTES.some((p) => p.id === saved)) {
        return saved;
      }
    }
    return "charcoal-ember";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-palette", palette);
      localStorage.setItem(STORAGE_KEY, palette);
    }
  }, [palette]);

  const currentPalette = PALETTES.find((p) => p.id === palette) || PALETTES[0];

  const setPalette = (id: PaletteId) => {
    setPaletteState(id);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-palette", id);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  return (
    <PaletteContext.Provider value={{ palette, currentPalette, setPalette, palettes: PALETTES }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }
  return ctx;
}
