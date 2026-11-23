import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to dark
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored || "dark";
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "light") {
      root.style.colorScheme = "light";
      // Apply light mode CSS variables
      root.style.setProperty("--background", "0 0% 100%");
      root.style.setProperty("--foreground", "240 10% 3.6%");
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--card-foreground", "240 10% 3.6%");
      root.style.setProperty("--popover", "0 0% 100%");
      root.style.setProperty("--popover-foreground", "240 10% 3.6%");
      root.style.setProperty("--primary", "14 100% 55%");
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      root.style.setProperty("--primary-dark", "14 87% 47%");
      root.style.setProperty("--primary-light", "14 100% 62%");
      root.style.setProperty("--secondary", "240 4.8% 95.9%");
      root.style.setProperty("--secondary-foreground", "240 10% 3.6%");
      root.style.setProperty("--muted", "240 4.8% 89.8%");
      root.style.setProperty("--muted-foreground", "240 3.7% 46.1%");
      root.style.setProperty("--accent", "33 100% 50%");
      root.style.setProperty("--accent-foreground", "0 0% 100%");
      root.style.setProperty("--accent-gold", "51 100% 50%");
      root.style.setProperty("--destructive", "0 84% 60%");
      root.style.setProperty("--destructive-foreground", "0 0% 100%");
      root.style.setProperty("--border", "240 5.9% 90%");
      root.style.setProperty("--border2", "240 5.9% 85%");
      root.style.setProperty("--border3", "240 5.9% 80%");
      root.style.setProperty("--input", "240 5.9% 90%");
      root.style.setProperty("--ring", "14 100% 55%");
      
      root.style.setProperty("--glass", "0 0% 0% / 0.02");
      root.style.setProperty("--glass2", "0 0% 0% / 0.04");
      root.style.setProperty("--glass3", "0 0% 0% / 0.08");
      
      root.style.setProperty("--glow", "14 100% 55% / 0.15");
      root.style.setProperty("--glow2", "14 100% 55% / 0.08");
      root.style.setProperty("--glow3", "14 100% 55% / 0.04");
      
      root.style.setProperty("--bg", "0 0% 100%");
      root.style.setProperty("--bg2", "240 4.8% 95.9%");
      root.style.setProperty("--bg3", "240 5.9% 90%");
      root.style.setProperty("--bg4", "240 5.9% 84%");
      root.style.setProperty("--bg5", "240 5.9% 79%");
      
      root.style.setProperty("--text", "240 10% 3.6%");
      root.style.setProperty("--text2", "240 5.9% 10%");
      root.style.setProperty("--text3", "240 5.2% 33.9%");
      root.style.setProperty("--text4", "240 5.9% 50%");
    } else {
      root.style.colorScheme = "dark";
      // Reset to dark mode (remove inline styles to use CSS variables)
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--card-foreground");
      root.style.removeProperty("--popover");
      root.style.removeProperty("--popover-foreground");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--primary-dark");
      root.style.removeProperty("--primary-light");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--secondary-foreground");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--muted-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--accent-gold");
      root.style.removeProperty("--destructive");
      root.style.removeProperty("--destructive-foreground");
      root.style.removeProperty("--border");
      root.style.removeProperty("--border2");
      root.style.removeProperty("--border3");
      root.style.removeProperty("--input");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--glass");
      root.style.removeProperty("--glass2");
      root.style.removeProperty("--glass3");
      root.style.removeProperty("--glow");
      root.style.removeProperty("--glow2");
      root.style.removeProperty("--glow3");
      root.style.removeProperty("--bg");
      root.style.removeProperty("--bg2");
      root.style.removeProperty("--bg3");
      root.style.removeProperty("--bg4");
      root.style.removeProperty("--bg5");
      root.style.removeProperty("--text");
      root.style.removeProperty("--text2");
      root.style.removeProperty("--text3");
      root.style.removeProperty("--text4");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
