
"use client"

import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { SystemSettings } from "@/types";
import { useEffect } from "react";

// Helper to convert hex to HSL for Shadcn
function hexToHsl(hex: string): string {
  hex = hex.replace(/#/g, '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function AppearanceManager() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "appearance"), [firestore]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  useEffect(() => {
    if (settings) {
      document.title = settings.systemName || "Carômetro";
      
      const root = document.documentElement;

      if (settings.primaryColor) {
        const hsl = hexToHsl(settings.primaryColor);
        root.style.setProperty('--primary', hsl);
        root.style.setProperty('--ring', hsl);
      }

      if (settings.hoverColor) {
        root.style.setProperty('--hover-color', settings.hoverColor);
      } else if (settings.primaryColor) {
        root.style.setProperty('--hover-color', settings.primaryColor);
      }

      if (settings.leadershipColor) {
        root.style.setProperty('--leadership', settings.leadershipColor);
      } else {
        root.style.setProperty('--leadership', '#f59e0b');
      }

      if (settings.backgroundColor) {
        root.style.setProperty('--background', hexToHsl(settings.backgroundColor));
      }

      if (settings.cardBackgroundColor) {
        root.style.setProperty('--card', hexToHsl(settings.cardBackgroundColor));
      }

      if (settings.foregroundColor) {
        root.style.setProperty('--foreground', hexToHsl(settings.foregroundColor));
      }

      if (settings.accentColor) {
        root.style.setProperty('--accent', hexToHsl(settings.accentColor));
      }

      if (settings.accentForegroundColor) {
        root.style.setProperty('--accent-foreground', hexToHsl(settings.accentForegroundColor));
      } else {
        root.style.setProperty('--accent-foreground', '0 0% 100%');
      }

      if (settings.nameColor) {
        root.style.setProperty('--name-color', hexToHsl(settings.nameColor));
      } else if (settings.primaryColor) {
        root.style.setProperty('--name-color', hexToHsl(settings.primaryColor));
      }

      if (settings.jobTitleColor) {
        root.style.setProperty('--job-color', hexToHsl(settings.jobTitleColor));
      }

      if (settings.sectorHeaderColor) {
        root.style.setProperty('--sector-header-color', hexToHsl(settings.sectorHeaderColor));
      } else if (settings.primaryColor) {
        root.style.setProperty('--sector-header-color', hexToHsl(settings.primaryColor));
      }

      if (settings.subCategoryColor) {
        root.style.setProperty('--subcategory-color', hexToHsl(settings.subCategoryColor));
      } else if (settings.primaryColor) {
        root.style.setProperty('--subcategory-color', hexToHsl(settings.primaryColor));
      }

      if (settings.sidebarBackgroundColor) {
        root.style.setProperty('--sidebar-background', hexToHsl(settings.sidebarBackgroundColor));
        root.style.setProperty('--sidebar-border', hexToHsl(settings.sidebarBackgroundColor));
      }

      if (settings.sidebarForegroundColor) {
        root.style.setProperty('--sidebar-foreground', hexToHsl(settings.sidebarForegroundColor));
      }
    }
  }, [settings]);

  return null;
}
