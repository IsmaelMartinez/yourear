/**
 * Internationalization (i18n) System
 * 
 * Simple but effective i18n for vanilla TypeScript.
 * Supports dynamic language switching and nested translation keys.
 */

import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { zh } from './locales/zh';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'zh';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
}

/** Available locales with display names */
export const AVAILABLE_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

/** Translation dictionary type (recursive for nested keys) */
export type TranslationDict = {
  [key: string]: string | TranslationDict;
};

/** All translation dictionaries */
const translations: Record<SupportedLocale, TranslationDict> = {
  en,
  es,
  fr,
  de,
  zh,
};

/** Storage key for language preference */
const LOCALE_STORAGE_KEY = 'yourear_locale';

/** Current active locale */
let currentLocale: SupportedLocale = 'en';

/** Render callback for re-rendering on language change */
let onLocaleChange: (() => void) | null = null;

/**
 * Set callback for locale changes
 */
export function setLocaleChangeCallback(callback: () => void): void {
  onLocaleChange = callback;
}

/**
 * Initialize i18n system
 * Loads saved locale or detects from browser
 */
export function initI18n(): void {
  // Try to load saved preference
  const saved = loadSavedLocale();
  if (saved) {
    currentLocale = saved;
    return;
  }

  // Detect from browser
  const detected = detectBrowserLocale();
  if (detected) {
    currentLocale = detected;
    saveLocale(detected);
  }
}

/**
 * Get the current locale
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Set the current locale
 */
export function setLocale(locale: SupportedLocale): void {
  if (locale !== currentLocale && translations[locale]) {
    currentLocale = locale;
    saveLocale(locale);
    document.documentElement.lang = locale;
    onLocaleChange?.();
  }
}

/**
 * Get a translation by key path (e.g., "home.title" or "common.buttons.start")
 * 
 * @param key - Dot-separated key path
 * @param params - Optional parameters for interpolation
 * @returns Translated string or key if not found
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale];
  const value = getNestedValue(dict, key);

  if (typeof value !== 'string') {
    // Fallback to English if key not found in current locale
    const fallback = getNestedValue(translations.en, key);
    if (typeof fallback !== 'string') {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return interpolate(fallback, params);
  }

  return interpolate(value, params);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: TranslationDict, path: string): string | TranslationDict | undefined {
  const keys = path.split('.');
  let current: TranslationDict | string | undefined = obj;

  for (const key of keys) {
    if (current === undefined || typeof current === 'string') {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Interpolate parameters into a string
 * Replaces {{paramName}} with actual values
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

/**
 * Detect browser locale
 */
function detectBrowserLocale(): SupportedLocale | null {
  const browserLangs = navigator.languages || [navigator.language];

  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase();
    if (isValidLocale(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Check if a locale code is valid
 */
function isValidLocale(code: string): code is SupportedLocale {
  return code in translations;
}

/**
 * Save locale preference to localStorage
 */
function saveLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load saved locale from localStorage
 */
function loadSavedLocale(): SupportedLocale | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isValidLocale(saved)) {
      return saved;
    }
  } catch {
    // localStorage might not be available
  }
  return null;
}

/**
 * Get locale info for the current locale
 */
export function getCurrentLocaleInfo(): LocaleInfo {
  return AVAILABLE_LOCALES.find(l => l.code === currentLocale) || AVAILABLE_LOCALES[0];
}

