import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enCommon from './locales/en/common.json';
import enHero from './locales/en/hero.json';
import enNarrative from './locales/en/narrative.json';
import enVault from './locales/en/vault.json';
import enMap from './locales/en/map.json';
import enContact from './locales/en/contact.json';
import enFooter from './locales/en/footer.json';
import enLoading from './locales/en/loading.json';
import enWines from './locales/en/wines.json';

import esCommon from './locales/es/common.json';
import esHero from './locales/es/hero.json';
import esNarrative from './locales/es/narrative.json';
import esVault from './locales/es/vault.json';
import esMap from './locales/es/map.json';
import esContact from './locales/es/contact.json';
import esFooter from './locales/es/footer.json';
import esLoading from './locales/es/loading.json';
import esWines from './locales/es/wines.json';

import srCommon from './locales/sr/common.json';
import srHero from './locales/sr/hero.json';
import srNarrative from './locales/sr/narrative.json';
import srVault from './locales/sr/vault.json';
import srMap from './locales/sr/map.json';
import srContact from './locales/sr/contact.json';
import srFooter from './locales/sr/footer.json';
import srLoading from './locales/sr/loading.json';
import srWines from './locales/sr/wines.json';

import zhCommon from './locales/zh/common.json';
import zhHero from './locales/zh/hero.json';
import zhNarrative from './locales/zh/narrative.json';
import zhVault from './locales/zh/vault.json';
import zhMap from './locales/zh/map.json';
import zhContact from './locales/zh/contact.json';
import zhFooter from './locales/zh/footer.json';
import zhLoading from './locales/zh/loading.json';
import zhWines from './locales/zh/wines.json';

import jaCommon from './locales/ja/common.json';
import jaHero from './locales/ja/hero.json';
import jaNarrative from './locales/ja/narrative.json';
import jaVault from './locales/ja/vault.json';
import jaMap from './locales/ja/map.json';
import jaContact from './locales/ja/contact.json';
import jaFooter from './locales/ja/footer.json';
import jaLoading from './locales/ja/loading.json';
import jaWines from './locales/ja/wines.json';

const resources = {
  en: {
    common: enCommon,
    hero: enHero,
    narrative: enNarrative,
    vault: enVault,
    map: enMap,
    contact: enContact,
    footer: enFooter,
    loading: enLoading,
    wines: enWines,
  },
  es: {
    common: esCommon,
    hero: esHero,
    narrative: esNarrative,
    vault: esVault,
    map: esMap,
    contact: esContact,
    footer: esFooter,
    loading: esLoading,
    wines: esWines,
  },
  sr: {
    common: srCommon,
    hero: srHero,
    narrative: srNarrative,
    vault: srVault,
    map: srMap,
    contact: srContact,
    footer: srFooter,
    loading: srLoading,
    wines: srWines,
  },
  zh: {
    common: zhCommon,
    hero: zhHero,
    narrative: zhNarrative,
    vault: zhVault,
    map: zhMap,
    contact: zhContact,
    footer: zhFooter,
    loading: zhLoading,
    wines: zhWines,
  },
  ja: {
    common: jaCommon,
    hero: jaHero,
    narrative: jaNarrative,
    vault: jaVault,
    map: jaMap,
    contact: jaContact,
    footer: jaFooter,
    loading: jaLoading,
    wines: jaWines,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    ns: ['common', 'hero', 'narrative', 'vault', 'map', 'contact', 'footer', 'loading', 'wines'],
    defaultNS: 'common',
  });

export default i18n;

// Language configuration
export const languages = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'sr', name: 'Srpski', flag: 'SR' },
  { code: 'zh', name: '中文', flag: '中文' },
  { code: 'ja', name: '日本語', flag: '日本語' },
] as const;

export type LanguageCode = typeof languages[number]['code'];
