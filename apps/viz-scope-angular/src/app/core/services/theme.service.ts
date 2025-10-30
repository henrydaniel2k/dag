/**
 * Theme Service
 * Manages light/dark theme switching and bridges CSS variables to GoJS
 */

import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * GoJS theme object with all styling properties
 */
export interface GojsTheme {
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  nodeTextMuted: string;
  metricText: string;
  alertText: string;
  highlightFill: string;
  highlightStroke: string;
  selectionStroke: string;
  linkStroke: string;
  hopStroke: string;
  metaFill: string;
  metaStroke: string;
  tooltipFill: string;
  tooltipStroke: string;
  tooltipText: string;
  iconFill: string;
  iconStroke: string;
  primary: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Current theme signal ('light' or 'dark')
   */
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    if (this.isBrowser) {
      // Initialize theme from localStorage or system preference
      this.initializeTheme();

      // Listen for system theme changes
      this.watchSystemTheme();
    }
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;

    if (stored) {
      this.setTheme(stored);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Watch for system theme changes
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-update if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Set the theme
   * @param theme Theme to set ('light' or 'dark')
   */
  setTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) return;

    this.theme.set(theme);

    // Update DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get CSS color from CSS custom property
   * @param varName Variable name (without --gojs- prefix)
   * @returns HSL color string
   */
  private getCSSColor(varName: string): string {
    if (!this.isBrowser) return '#000000';

    const hsl = getComputedStyle(document.documentElement)
      .getPropertyValue(`--gojs-${varName}`)
      .trim();
    return hsl ? `hsl(${hsl})` : '#000000';
  }

  /**
   * Get GoJS theme object from CSS variables
   * @returns GojsTheme with all styling properties
   */
  getGojsTheme(): GojsTheme {
    return {
      nodeFill: this.getCSSColor('node-fill'),
      nodeStroke: this.getCSSColor('node-stroke'),
      nodeText: this.getCSSColor('node-text'),
      nodeTextMuted: this.getCSSColor('node-text-muted'),
      metricText: this.getCSSColor('metric-text'),
      alertText: this.getCSSColor('alert-text'),
      highlightFill: this.getCSSColor('highlight-fill'),
      highlightStroke: this.getCSSColor('highlight-stroke'),
      selectionStroke: this.getCSSColor('selection-stroke'),
      linkStroke: this.getCSSColor('link-stroke'),
      hopStroke: this.getCSSColor('hop-stroke'),
      metaFill: this.getCSSColor('meta-fill'),
      metaStroke: this.getCSSColor('meta-stroke'),
      tooltipFill: this.getCSSColor('tooltip-fill'),
      tooltipStroke: this.getCSSColor('tooltip-stroke'),
      tooltipText: this.getCSSColor('tooltip-text'),
      iconFill: this.getCSSColor('icon-fill'),
      iconStroke: this.getCSSColor('icon-stroke'),
      primary: this.getCSSColor('primary'),
    };
  }

  /**
   * Apply theme to GoJS diagram
   * This will be called by GojsService
   * @param diagram GoJS diagram instance (typed as any due to GoJS dynamic nature)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyTheme(diagram: any): void {
    if (!diagram) return;

    const theme = this.getGojsTheme();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diagram.commit((d: any) => {
      if (d.model.modelData) {
        d.model.set(d.model.modelData, 'theme', theme);
      } else {
        d.model.modelData = { theme };
      }
    }, 'update-theme');

    diagram.updateAllTargetBindings();
  }
}
