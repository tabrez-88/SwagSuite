import { useEffect, createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  // Sidebar colors
  sidebarBackgroundColor?: string;
  sidebarTextColor?: string;
  sidebarBorderColor?: string;
  // Navigation colors
  navHoverColor?: string;
  navActiveColor?: string;
  navTextColor?: string;
  navTextActiveColor?: string;
  // Border and UI colors
  borderColor?: string;
  // Other settings
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  tagline?: string;
  borderRadius?: string;
  fontFamily?: string;
}

interface ThemeContextType {
  theme: ThemeSettings | undefined;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: undefined,
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: theme, isLoading } = useQuery<ThemeSettings>({
    queryKey: ['/api/settings/branding'],
    queryFn: async () => {
      const response = await fetch('/api/settings/branding', {
        credentials: 'include',
      });
      if (!response.ok) {
        // Return default theme if fetch fails
        return {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#10b981',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderRadius: 'medium',
          fontFamily: 'inter',
        };
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (theme) {
      const root = document.documentElement;

      // Apply color variables
      if (theme.primaryColor) {
        root.style.setProperty('--theme-primary', theme.primaryColor);
        // Generate lighter and darker variants for better UI
        root.style.setProperty('--theme-primary-light', adjustColor(theme.primaryColor, 20));
        root.style.setProperty('--theme-primary-dark', adjustColor(theme.primaryColor, -20));
      }

      if (theme.secondaryColor) {
        root.style.setProperty('--theme-secondary', theme.secondaryColor);
        root.style.setProperty('--theme-secondary-light', adjustColor(theme.secondaryColor, 20));
        root.style.setProperty('--theme-secondary-dark', adjustColor(theme.secondaryColor, -20));
      }

      if (theme.accentColor) {
        root.style.setProperty('--theme-accent', theme.accentColor);
        root.style.setProperty('--theme-accent-light', adjustColor(theme.accentColor, 20));
        root.style.setProperty('--theme-accent-dark', adjustColor(theme.accentColor, -20));
      }

      if (theme.backgroundColor) {
        root.style.setProperty('--theme-background', theme.backgroundColor);
      }

      if (theme.textColor) {
        root.style.setProperty('--theme-text', theme.textColor);
      }

      // Sidebar colors
      if (theme.sidebarBackgroundColor) {
        root.style.setProperty('--theme-sidebar-bg', theme.sidebarBackgroundColor);
      }

      if (theme.sidebarTextColor) {
        root.style.setProperty('--theme-sidebar-text', theme.sidebarTextColor);
      }

      if (theme.sidebarBorderColor) {
        root.style.setProperty('--theme-sidebar-border', theme.sidebarBorderColor);
      }

      // Navigation colors
      if (theme.navHoverColor) {
        root.style.setProperty('--theme-nav-hover', theme.navHoverColor);
      }

      if (theme.navActiveColor) {
        root.style.setProperty('--theme-nav-active', theme.navActiveColor);
      }

      if (theme.navTextColor) {
        root.style.setProperty('--theme-nav-text', theme.navTextColor);
      }

      if (theme.navTextActiveColor) {
        root.style.setProperty('--theme-nav-text-active', theme.navTextActiveColor);
      }

      // Border color
      if (theme.borderColor) {
        root.style.setProperty('--theme-border', theme.borderColor);
      }

      // Apply border radius
      const borderRadiusMap: Record<string, string> = {
        none: '0px',
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem',
      };
      if (theme.borderRadius) {
        root.style.setProperty('--theme-radius', borderRadiusMap[theme.borderRadius] || '0.5rem');
      }

      // Apply font family
      const fontFamilyMap: Record<string, string> = {
        inter: "'Inter', sans-serif",
        roboto: "'Roboto', sans-serif",
        opensans: "'Open Sans', sans-serif",
        lato: "'Lato', sans-serif",
        poppins: "'Poppins', sans-serif",
      };
      if (theme.fontFamily) {
        root.style.setProperty('--theme-font', fontFamilyMap[theme.fontFamily] || fontFamilyMap.inter);
      }

      // Update favicon if provided
      if (theme.faviconUrl) {
        updateFavicon(theme.faviconUrl);
      }

      // Update page title if company name provided
      if (theme.companyName) {
        document.title = theme.companyName;
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, percent: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjustValue = (val: number) => {
    const adjusted = val + (255 - val) * (percent / 100);
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  };

  const newR = adjustValue(r);
  const newG = adjustValue(g);
  const newB = adjustValue(b);

  // Convert back to hex
  const toHex = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Helper function to update favicon
function updateFavicon(url: string) {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
}
