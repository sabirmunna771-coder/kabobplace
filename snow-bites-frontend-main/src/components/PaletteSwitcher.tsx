import { useState, useRef, useEffect } from "react";
import { usePalette, type PaletteId } from "@/context/PaletteContext";
import { Palette, Check, ChevronDown } from "lucide-react";

interface PaletteSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function PaletteSwitcher({ compact = false, className = "" }: PaletteSwitcherProps) {
  const { palette, setPalette, palettes, currentPalette } = usePalette();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-md text-xs font-semibold text-foreground hover:border-primary/50 hover:bg-card/90 transition-all shadow-sm"
        title="Change Color Palette"
        aria-label="Change Color Palette"
      >
        <span className="flex items-center -space-x-1">
          <span
            className="w-3 h-3 rounded-full border border-black/20 shadow-sm"
            style={{ backgroundColor: currentPalette.swatches.bg }}
          />
          <span
            className="w-3 h-3 rounded-full border border-black/20 shadow-sm"
            style={{ backgroundColor: currentPalette.swatches.button }}
          />
          <span
            className="w-3 h-3 rounded-full border border-black/20 shadow-sm"
            style={{ backgroundColor: currentPalette.swatches.price }}
          />
        </span>

        {!compact && (
          <span className="hidden sm:inline font-medium">
            {currentPalette.name}
          </span>
        )}

        <ChevronDown size={13} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl p-2 z-[9999] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-border/60 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Palette size={12} className="text-primary" />
              Paleta de Colores
            </p>
            <p className="text-xs text-foreground/80 mt-0.5">Elige el estilo visual de Kabob Place</p>
          </div>

          <div className="space-y-1">
            {palettes.map((p) => {
              const isSelected = p.id === palette;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPalette(p.id as PaletteId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-primary/15 border border-primary/30 text-foreground font-semibold"
                      : "hover:bg-accent/10 border border-transparent text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch preview */}
                    <div className="flex items-center -space-x-1.5 p-1 rounded-lg border border-border/70 bg-black/10">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: p.swatches.bg }}
                        title={`Background ${p.swatches.bg}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: p.swatches.button }}
                        title={`Buttons ${p.swatches.button}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: p.swatches.price }}
                        title={`Prices ${p.swatches.price}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">
                          {p.number}. {p.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-bold">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {p.nameEs}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={16} className="text-primary shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
