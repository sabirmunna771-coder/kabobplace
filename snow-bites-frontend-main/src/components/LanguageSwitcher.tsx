import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const current = availableLanguages.find((l) => l.code === language) ?? availableLanguages[0];

  return (
    <div ref={containerRef} className="relative z-[1100]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("lang.label")}
        title={t("lang.label")}
        className="inline-flex items-center gap-1.5 bg-glass-2 border border-border px-2.5 md:px-3 h-[42px] rounded-xl text-xs font-semibold text-txt-2 hover:text-foreground hover:bg-glass-3 transition-all"
      >
        <Globe size={14} className="text-primary flex-shrink-0" />
        <span className="font-bold tracking-wide">{current?.shortLabel}</span>
        {!compact && <span className="hidden xl:inline text-txt-3 font-normal">{current?.label}</span>}
        <ChevronDown size={12} className={`text-txt-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-bg-2/95 backdrop-blur-xl shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[2px] text-txt-4">
            {t("lang.label")}
          </div>
          {availableLanguages.map((lang) => {
            const active = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                  active
                    ? "bg-primary/15 text-foreground border border-primary/25"
                    : "text-txt-2 hover:bg-glass-2 hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded bg-glass-3 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {lang.shortLabel}
                    </span>
                    {lang.label}
                  </span>
                  <span className="text-[10px] text-txt-4 mt-0.5">{lang.region}</span>
                </div>
                {active && <Check size={14} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

