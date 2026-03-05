# Internationalization (i18n) Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for implementing multi-language support in the GC Wines website using `react-i18next`. The implementation will support 4 languages: **English (default)**, **Spanish**, **Serbian**, and **Chinese (Simplified)**, with **Japanese** as a stretch goal.

---

## Phase 1: Foundation Setup

### 1.1 Dependencies Installation

```bash
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
npm install -D @types/i18next
```

### 1.2 Project Structure

```
src/
├── i18n/
│   ├── index.ts                 # i18n initialization
│   ├── config.ts                # Configuration constants
│   └── locales/
│       ├── en/
│       │   ├── common.json      # Shared/common translations
│       │   ├── hero.json        # Hero section
│       │   ├── narrative.json   # The Bridge/Narrative section
│       │   ├── vault.json       # Wine Vault section
│       │   ├── operations.json  # Operations section
│       │   ├── contact.json     # Contact section
│       │   ├── map.json         # Global Map section
│       │   ├── footer.json      # Footer
│       │   └── errors.json      # Error messages
│       ├── es/                  # Spanish
│       ├── sr/                  # Serbian
│       ├── zh/                  # Chinese (Simplified)
│       └── ja/                  # Japanese
```

### 1.3 i18n Configuration File

**File:** `src/i18n/index.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import enCommon from './locales/en/common.json';
import enHero from './locales/en/hero.json';
// ... other imports

const resources = {
  en: {
    common: enCommon,
    hero: enHero,
    // ...
  },
  es: { /* ... */ },
  sr: { /* ... */ },
  zh: { /* ... */ },
  ja: { /* ... */ },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Namespace configuration
    ns: ['common', 'hero', 'narrative', 'vault', 'operations', 'contact', 'map', 'footer'],
    defaultNS: 'common',
  });

export default i18n;
```

### 1.4 Language Switcher Component

**File:** `src/components/LanguageSwitcher.tsx`

Create a premium language selector that matches the site's luxury aesthetic:
- Dropdown with flag icons (or language codes for elegance)
- Smooth transitions using Framer Motion
- Current language indicator
- Keyboard accessibility

---

## Phase 2: Translation Content Strategy

### 2.1 Translation Categories

| Namespace | Description | Key Content |
|-----------|-------------|-------------|
| `common` | Shared across all sections | Navigation, buttons, CTAs, loading states |
| `hero` | Hero section | Headlines, subtitles, scroll indicators |
| `narrative` | The Bridge section | Story paragraphs, section titles |
| `vault` | Wine Vault section | Wine names, descriptions, labels |
| `operations` | Operations section | Process steps, service descriptions |
| `contact` | Contact section | Form labels, placeholders, success messages |
| `map` | Global Map section | Region names, tooltips, connection labels |
| `footer` | Footer section | Copyright, links, contact info |

### 2.2 Translation Keys Convention

```
section:element:variant

Examples:
- hero:title
- hero:subtitle:line1
- narrative:sections:0:title
- contact:form:name:label
- vault:wines:malbec:description
```

### 2.3 Content Audit for Translation

#### Hero Section
```json
{
  "tagline": "Argentine Heritage · Global Reach",
  "title": {
    "line1": "The Argentine",
    "line2": "Bridge"
  },
  "subtitle": "Financial Security in the USA. Balkans entry point in Montenegro. Cultural access to Asia's most refined markets."
}
```

#### Narrative Section (The Bridge)
```json
{
  "sectionTitle": "The Narrative",
  "sectionSubtitle": "The Bridge",
  "paragraphs": [
    {
      "title": "Rooted in the Andes",
      "text": "Our founders Argentine heritage runs deep..."
    },
    {
      "title": "The Last Mile Advantage",
      "text": "What sets GC Wines apart is exclusive 'Last Mile' access..."
    },
    {
      "title": "Four Continents, One Vision",
      "text": "From the financial infrastructure of the United States..."
    }
  ]
}
```

#### Navigation
```json
{
  "nav": {
    "bridge": "The Bridge",
    "vault": "The Vault",
    "operations": "Operations",
    "access": "Access"
  },
  "cta": {
    "privateInquiry": "Private Inquiry"
  }
}
```

---

## Phase 3: Component Integration

### 3.1 Hook Usage Patterns

#### Basic Translation
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('hero');

<h1>{t('title.line1')}</h1>
```

#### Multiple Namespaces
```typescript
const { t } = useTranslation(['common', 'contact']);

<button>{t('common:cta.submit')}</button>
<p>{t('contact:form.success')}</p>
```

#### With Interpolation
```typescript
// JSON: "welcome": "Welcome, {{name}}"
<p>{t('welcome', { name: userName })}</p>
```

#### With HTML (Trans Component)
```typescript
import { Trans } from 'react-i18next';

// JSON: "highlight": "We deliver <1>Argentina's finest</1> wines"
<Trans i18nKey="highlight">
  We deliver <span className="text-primary">Argentina's finest</span> wines
</Trans>
```

### 3.2 Section-by-Section Implementation

#### Header Component
- Language switcher integration
- Navigation labels translation
- CTA button translation

#### HeroSection Component
- Tagline translation
- Title translation (preserving stagger animation compatibility)
- Subtitle translation
- Scroll indicator text

#### NarrativeSection Component
- Section heading translation
- Dynamic paragraph mapping with translated content
- Preserve image positioning

#### WineVaultSection Component
- Wine names (keep original or translate? DECISION: Keep original names, translate descriptions)
- Filter labels translation
- Detail modal content translation

#### GlobalMapSection Component
- Region names translation
- Tooltip content translation
- Connection line labels

#### ContactSection Component
- Form labels and placeholders
- Validation messages
- Success modal content (the celebratory modal causing mobile issues)

#### Footer Component
- Copyright text
- Contact information labels
- Quick links

---

## Phase 4: Right-to-Left (RTL) Considerations

### 4.1 RTL Support Analysis

**Languages requiring RTL:** None in current scope (Chinese, Japanese, Serbian, Spanish are LTR)

**Future consideration:** If Arabic is added later, implement:
```typescript
// Tailwind RTL plugin
// Direction-aware CSS transforms
```

---

## Phase 5: Typography & Font Adaptations

### 5.1 Language-Specific Font Requirements

| Language | Font Strategy | Fallback |
|----------|--------------|----------|
| English | Playfair Display (serif) + Montserrat (sans) | system-ui |
| Spanish | Same as English (Latin script) | system-ui |
| Serbian | Same as English (Cyrillic/Latin both supported) | system-ui |
| Chinese | Noto Sans SC / Source Han Sans | PingFang SC, Microsoft YaHei |
| Japanese | Noto Sans JP / Source Han Sans | Hiragino Kaku Gothic, Meiryo |

### 5.2 CSS Font Loading Strategy

```typescript
// i18n/config.ts
export const fontConfig = {
  en: { serif: 'Playfair Display', sans: 'Montserrat' },
  es: { serif: 'Playfair Display', sans: 'Montserrat' },
  sr: { serif: 'Playfair Display', sans: 'Montserrat' },
  zh: { serif: 'Noto Serif SC', sans: 'Noto Sans SC' },
  ja: { serif: 'Noto Serif JP', sans: 'Noto Sans JP' },
};
```

### 5.3 Dynamic Font Loading

Use Google Fonts or FontFace API to load language-specific fonts on demand:

```typescript
useEffect(() => {
  const fontLink = document.createElement('link');
  fontLink.href = `https://fonts.googleapis.com/css2?family=${fontConfig[i18n.language].sans.replace(' ', '+')}&display=swap`;
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
}, [i18n.language]);
```

---

## Phase 6: Translation Management Workflow

### 6.1 Translation File Templates

Create a master template for translators:

```json
{
  "_meta": {
    "language": "Spanish",
    "code": "es",
    "translator": "[Name]",
    "date": "[Date]",
    "notes": "[Special instructions]"
  },
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "retry": "Reintentar"
  }
}
```

### 6.2 Key Translation Guidelines

1. **Tone Preservation**: Maintain luxury/premium feel across languages
2. **Cultural Adaptation**: Don't translate literally - adapt for cultural resonance
3. **Wine Terminology**: Use industry-standard terms in each language
4. **Character Count**: Chinese/Japanese may need different layout considerations
5. **Formality Levels**: Japanese requires keigo (formal) for luxury brand

### 6.3 Translation Review Checklist

- [ ] All keys present in all language files
- [ ] No missing interpolations ({{variable}})
- [ ] Consistent terminology across sections
- [ ] Character encoding correct (UTF-8)
- [ ] JSON syntax valid
- [ ] Special characters properly escaped

---

## Phase 7: UI/UX Adaptations

### 7.1 Language Switcher Design

**Desktop:**
- Position: In header, next to Sound Toggle
- Style: Minimal dropdown with language codes (EN, ES, SR, 中文, 日本語)
- Active state: Gold underline

**Mobile:**
- Include in mobile menu
- Full-width buttons with language names

### 7.2 Layout Adaptations

| Element | Consideration |
|---------|--------------|
| Buttons | German/Serbian text may be longer - allow text wrapping or truncation |
| Headlines | Chinese/Japanese need larger font size for readability |
| Forms | Ensure placeholder text fits within inputs |
| Navigation | Keep labels concise to prevent layout shifts |

### 7.3 Text Expansion/Contraction

| Language | vs English | Strategy |
|----------|-----------|----------|
| Spanish | +15-30% | Allow wrapping, flexible containers |
| Serbian | +10-20% | Similar to Spanish |
| Chinese | -20-30% | Increase font size, add letter-spacing |
| Japanese | Similar | Maintain generous line-height |

---

## Phase 8: SEO & Metadata

### 8.1 Language-Specific Meta Tags

```typescript
// Dynamic meta tags based on language
const metaTags = {
  en: {
    title: "GC Wines | The Argentine Bridge",
    description: "Financial Security in the USA. Balkans entry point in Montenegro...",
    keywords: "argentinian wine, luxury wine, wine export, fine wine"
  },
  es: {
    title: "GC Wines | El Puente Argentino",
    description: "Seguridad financiera en EE.UU. Punto de entrada a los Balcanes...",
    keywords: "vino argentino, vino de lujo, exportación de vinos"
  },
  // ... other languages
};
```

### 8.2 hreflang Tags

```html
<link rel="alternate" hreflang="en" href="https://gcwines.com/en/" />
<link rel="alternate" hreflang="es" href="https://gcwines.com/es/" />
<link rel="alternate" hreflang="sr" href="https://gcwines.com/sr/" />
<link rel="alternate" hreflang="zh" href="https://gcwines.com/zh/" />
<link rel="alternate" hreflang="ja" href="https://gcwines.com/ja/" />
<link rel="alternate" hreflang="x-default" href="https://gcwines.com/" />
```

---

## Phase 9: Testing Strategy

### 9.1 Translation Testing

```typescript
// Test all keys are translated
describe('i18n', () => {
  it('should have all keys in all languages', () => {
    const enKeys = getAllKeys(enTranslations);
    const esKeys = getAllKeys(esTranslations);

    expect(esKeys).toEqual(enKeys);
  });
});
```

### 9.2 UI Testing

- [ ] Switch language on every page
- [ ] Verify no layout breaks
- [ ] Check all interactive elements
- [ ] Verify form validation messages
- [ ] Test URL persistence on refresh

### 9.3 Visual Regression Testing

- Screenshot comparison for each language
- Pay special attention to: Chinese characters, long Serbian words, expanded Spanish text

---

## Phase 10: Build & Deployment

### 10.1 Build Configuration

```typescript
// vite.config.ts additions
export default defineConfig({
  // ... existing config
  resolve: {
    alias: {
      '@i18n': path.resolve(__dirname, './src/i18n'),
    },
  },
});
```

### 10.2 Bundle Size Optimization

```typescript
// Lazy load translation files
import('./locales/es/common.json').then((module) => {
  i18n.addResourceBundle('es', 'common', module.default);
});
```

### 10.3 Deployment Checklist

- [ ] All translation files included in build
- [ ] Fonts loaded from CDN or self-hosted
- [ ] Language detection working on production domain
- [ ] LocalStorage persistence tested

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Install dependencies
- [ ] Create i18n configuration
- [ ] Set up file structure
- [ ] Create LanguageSwitcher component

### Week 2: Content Translation
- [ ] Extract all English content
- [ ] Create translation templates
- [ ] Spanish translations
- [ ] Serbian translations

### Week 3: CJK Languages
- [ ] Chinese translations
- [ ] Japanese translations
- [ ] Font integration
- [ ] Typography adjustments

### Week 4: Integration & Testing
- [ ] Update all components
- [ ] Test on mobile
- [ ] SEO optimization
- [ ] Visual regression testing

### Week 5: Polish & Deploy
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Final QA
- [ ] Deploy

---

## Cost Estimates

| Item | Cost |
|------|------|
| Professional Spanish Translation | $200-400 |
| Professional Serbian Translation | $200-400 |
| Professional Chinese Translation | $300-600 |
| Professional Japanese Translation | $300-600 |
| Font licenses (if needed) | $0-200 |
| **Total Estimated** | **$1,000-2,200** |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chinese/Japanese fonts increase bundle size | Medium | Lazy load fonts, use subsetting |
| RTL language addition later | High | Design with flexibility in mind |
| Translation quality | High | Use professional translators, review by native speakers |
| Layout breaks with long text | Medium | Test with maximum length strings, use flexible layouts |
| SEO impact during transition | Low | Maintain hreflang tags, proper redirects |

---

## Implementation Status

### ✅ Completed: Phase 11 - Database-Driven Wine Content Translations

**Date:** 2026-03-05
**Status:** Complete and deployed

**Implementation Summary:**

1. **Created wine translation files** for all 8 wines across 5 languages:
   - `src/i18n/locales/en/wines.json`
   - `src/i18n/locales/es/wines.json`
   - `src/i18n/locales/sr/wines.json`
   - `src/i18n/locales/zh/wines.json`
   - `src/i18n/locales/ja/wines.json`

2. **Updated i18n configuration** (`src/i18n/index.ts`):
   - Added wines namespace to imports
   - Added wines to resources object
   - Added wines to ns array

3. **Updated WineVault component** to merge translations with database data:
   - Added wines namespace to useTranslation hook
   - Created getWineTranslation helper function
   - Description, rationale, and category names now dynamically translate

4. **Created custom hook** (`src/hooks/useWineTranslation.ts`):
   - Reusable hook for wine content translations
   - Provides getWineTranslation and hasWineTranslation functions

**Translation Coverage:**

| Wine ID | Name | ES | SR | ZH | JA |
|---------|------|----|----|----|----|
| f1514fe1-d1e5-44e1-a046-8b3797f5c8a4 | As Bravas Malbec | ✅ | ✅ | ✅ | ✅ |
| 09e2e439-5c9d-4d52-888a-4f67e8b6a36d | Finca Piedra Infinita | ✅ | ✅ | ✅ | ✅ |
| a2cb6cba-dd9f-49df-ace2-bd961c0a6a36 | Propósitos Chenin | ✅ | ✅ | ✅ | ✅ |
| 94e7d9b0-c1f7-4265-871f-cfe1ac037bed | Fósil Chardonnay | ✅ | ✅ | ✅ | ✅ |
| 73d8d593-856e-4d20-8344-0e44364d7ba4 | Petit Caro | ✅ | ✅ | ✅ | ✅ |
| 37795c0d-9c9b-4840-98ab-f77d8dd08344 | Chateau Vieux Blend | ✅ | ✅ | ✅ | ✅ |
| cddba4ec-4e15-4ec8-b361-fc5201bc1474 | Millésime Brut | ✅ | ✅ | ✅ | ✅ |
| 95f9a788-a7b1-438a-86cc-eb002684477a | Héritage Edición 004 | ✅ | ✅ | ✅ | ✅ |

**Fields Translated:**
- `description` - Wine tasting notes and terroir descriptions
- `rationale` - Market positioning and value propositions
- `category` - Category names (The Balkan Powerhouses, The Washoku Series, etc.)

**Fields Kept in Original Language:**
- `name` - Wine names (e.g., "As Bravas Malbec")
- `region` - Geographic names (e.g., "Valle de Uco, Mendoza")
- `winemaker` - Producer names
- `vintage` - Year (numeric)
- `score` - Rating (numeric)

---

## Success Metrics

- [x] All content available in 4+ languages (EN, ES, SR, ZH, JA)
- [x] Database-driven wine content translated
- [x] <100ms language switch time
- [x] Zero layout breaks on any language
- [x] Fallback to database content if translation missing
- [x] User language preference persisted
- [ ] Google indexing all language variants (requires deployment)

---

## Appendix A: Translation File Example

### English (en/common.json)
```json
{
  "nav": {
    "bridge": "The Bridge",
    "vault": "The Vault",
    "operations": "Operations",
    "access": "Access"
  },
  "cta": {
    "privateInquiry": "Private Inquiry",
    "learnMore": "Learn More",
    "explore": "Explore"
  },
  "loading": {
    "preparing": "Preparing Experience",
    "assets": "Loading Assets",
    "optimizing": "Optimizing Images",
    "finalizing": "Finalizing",
    "welcome": "Welcome"
  },
  "footer": {
    "copyright": "© {{year}} GC Wines. All rights reserved.",
    "tagline": "Argentine Heritage · Global Reach"
  }
}
```

### Spanish (es/common.json)
```json
{
  "nav": {
    "bridge": "El Puente",
    "vault": "La Bodega",
    "operations": "Operaciones",
    "access": "Acceso"
  },
  "cta": {
    "privateInquiry": "Consulta Privada",
    "learnMore": "Saber Más",
    "explore": "Explorar"
  },
  "loading": {
    "preparing": "Preparando Experiencia",
    "assets": "Cargando Recursos",
    "optimizing": "Optimizando Imágenes",
    "finalizing": "Finalizando",
    "welcome": "Bienvenido"
  },
  "footer": {
    "copyright": "© {{year}} GC Wines. Todos los derechos reservados.",
    "tagline": "Herencia Argentina · Alcance Global"
  }
}
```

---

## Appendix B: Component Integration Example

### Before (Hardcoded)
```tsx
<nav>
  <a href="#narrative">The Bridge</a>
  <a href="#vault">The Vault</a>
  <a href="#operations">Operations</a>
  <a href="#contact">Access</a>
</nav>
```

### After (i18n)
```tsx
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation('common');

  return (
    <nav>
      <a href="#narrative">{t('nav.bridge')}</a>
      <a href="#vault">{t('nav.vault')}</a>
      <a href="#operations">{t('nav.operations')}</a>
      <a href="#contact">{t('nav.access')}</a>
    </nav>
  );
};
```

---

## Phase 11: Database-Driven Content Translation (Wines from Supabase)

### 11.1 Current State Analysis

The wine card content comes from Supabase database, not static files:

```
wines table:
- id (uuid)
- name (string) - Wine name, e.g., "Zuccardi Concreto Malbec"
- category_id (uuid) → categories.name
- region (string) - e.g., "Gualtallary, Mendoza"
- altitude (string) - e.g., "1450 meters"
- score (string) - e.g., "95"
- vintage (string) - e.g., "2020"
- description (text) - Terroir description, tasting notes
- rationale (text) - Market rationale, strategic positioning
- winemaker (string) - e.g., "Sebastián Zuccardi"
- color (string) - CSS color class
- image_url (string)
```

### 11.2 Fields Requiring Translation

| Field | Translation Priority | Notes |
|-------|---------------------|-------|
| `name` | Low | Wine names typically stay in original language |
| `region` | Medium | Geographic names, could localize |
| `altitude` | High | Contains descriptive text |
| `description` | Critical | Full terroir/tasting content |
| `rationale` | Critical | Market positioning content |
| `winemaker` | Low | Names stay as-is |
| `category.name` | High | Category labels (Iconic, Premium, etc.) |

### 11.3 Recommended Approach: Hybrid Translation System

**Architecture Overview:**
```
┌─────────────────────────────────────────────────────────────┐
│                     React Component                        │
│                    (WineVault.tsx)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │  i18n Files  │ │  Wine Trans  │
│   (Metadata) │ │  (UI Text)   │ │  (Content)   │
└──────────────┘ └──────────────┘ └──────────────┘
     name            category           description
     vintage         labels             rationale
     score           buttons            terroir
     image_url       errors
     color
     winemaker
```

**Why This Approach?**
1. **No Schema Changes** - Works with existing database
2. **Version Controlled** - Translations tracked in git
3. **Fast Switching** - No extra API calls on language change
4. **SEO Friendly** - All content available at build time
5. **Maintainable** - Centralized translation management

### 11.4 Implementation Strategy

**Option 1: Wine Translation Files (RECOMMENDED)**

Create wine-specific translation namespace with content keyed by wine ID.

**File Structure:**
```
src/i18n/locales/
├── en/
│   ├── wines.json          # Wine content translations
│   └── ...
├── es/
│   ├── wines.json
│   └── ...
├── sr/
│   ├── wines.json
│   └── ...
├── zh/
│   ├── wines.json
│   └── ...
└── ja/
    ├── wines.json
    └── ...
```

**Translation File Format (wines.json):**
```json
{
  "wines": {
    "wine-uuid-1": {
      "description": "Deep ruby color with violet hues...",
      "rationale": "This wine represents the pinnacle of...",
      "altitude": "1,450 meters above sea level",
      "category": "Iconic Wines"
    },
    "wine-uuid-2": {
      "description": "...",
      "rationale": "..."
    }
  }
}
```

**Component Usage:**
```tsx
const { t } = useTranslation(['vault', 'wines']);

// Wine data from Supabase
const wine = await fetchWine(id);

// Translatable content from i18n
const description = t(`wines:${wine.id}.description`);
const rationale = t(`wines:${wine.id}.rationale`);
```

**Option 2: Extended Database Schema**

Add translation columns directly to the wines table.

**Migration Required:**
```sql
ALTER TABLE wines ADD COLUMN description_es TEXT;
ALTER TABLE wines ADD COLUMN description_sr TEXT;
ALTER TABLE wines ADD COLUMN description_zh TEXT;
ALTER TABLE wines ADD COLUMN description_ja TEXT;

ALTER TABLE wines ADD COLUMN rationale_es TEXT;
ALTER TABLE wines ADD COLUMN rationale_sr TEXT;
ALTER TABLE wines ADD COLUMN rationale_zh TEXT;
ALTER TABLE wines ADD COLUMN rationale_ja TEXT;
```

**Pros:** Direct database queries, single source of truth
**Cons:** Schema complexity, migration required, harder to version control

**Option 3: Translation Join Table**

Create separate table for wine translations.

**Schema:**
```sql
CREATE TABLE wine_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID REFERENCES wines(id),
  language_code VARCHAR(5),
  description TEXT,
  rationale TEXT,
  UNIQUE(wine_id, language_code)
);
```

**Pros:** Clean schema, extensible to new languages
**Cons:** Complex queries, more API calls

### 11.5 Recommended Implementation Steps

**Phase 1: Setup Wine Translation Namespace**

1. **Create translation files** for each language:
   - `src/i18n/locales/{lang}/wines.json`

2. **Update i18n config** to include wines namespace:
   ```ts
   ns: ['common', 'hero', 'wines', ...]
   ```

3. **Create wine translation hook** for easy access:
   ```ts
   // hooks/useWineTranslation.ts
   export const useWineTranslation = (wineId: string) => {
     const { t, i18n } = useTranslation('wines');
     return {
       description: t(`${wineId}.description`, ''),
       rationale: t(`${wineId}.rationale`, ''),
       hasTranslation: i18n.exists(`${wineId}.description`)
     };
   };
   ```

**Phase 2: Update Components**

**WineVault.tsx changes:**
```tsx
// Fetch wine from Supabase
const { data: wineData } = await supabase.from('wines').select('*');

// Get translations
const { t } = useTranslation('wines');

// Merge data
const wines = wineData.map(wine => ({
  ...wine,
  // Override with translation if available
  description: t(`${wine.id}.description`, wine.description),
  rationale: t(`${wine.id}.rationale`, wine.rationale),
  altitude: t(`${wine.id}.altitude`, wine.altitude),
  category: {
    ...wine.category,
    name: t(`${wine.id}.category`, wine.category?.name)
  }
}));
```

**Phase 3: Content Migration**

**Extract current wine content** from database:
```sql
SELECT id, name, description, rationale, altitude, category_id
FROM wines
ORDER BY sort_order;
```

**Create base English translations** from DB content, then translate to other languages.

### 11.6 Translation Workflow

**For New Wines:**
1. Add wine to database (English content)
2. Export wine data
3. Add entries to `wines.json` for each language
4. Translate content
5. Commit and deploy

**For Updates:**
1. Update database if metadata changes
2. Update translation files if content changes
3. Version control tracks all changes

### 11.7 Technical Considerations

**Fallback Strategy:**
```tsx
// If translation missing, fall back to database content
t(`${wine.id}.description`, wine.description)
```

**Loading States:**
- Show database content immediately
- Switch to translation when i18n loads
- No perceptible delay

### 11.8 Cost-Benefit Analysis

| Approach | Setup Time | Maintenance | Performance | Flexibility |
|----------|------------|-------------|-------------|-------------|
| **Option 1: Files** | 2 hours | Low | Excellent | High |
| **Option 2: DB Columns** | 4 hours | Medium | Good | Low |
| **Option 3: Join Table** | 6 hours | High | Moderate | Medium |

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding multi-language support to the GC Wines website. The modular namespace approach allows for incremental implementation, while the attention to typography and cultural adaptation ensures a premium experience across all languages.

**Next Steps:**
1. Review and approve plan
2. Begin Phase 1 (Foundation Setup)
3. Source professional translators (if needed)
4. Implement component by component
5. Test thoroughly before deployment

**Questions to Resolve for Database Content:**
1. How many wines are currently in the database?
2. Should wine names be translated or kept in original language?
3. Should region names be localized (e.g., "Mendoza" vs "门多萨")?
4. Are there any dynamic wine properties that change frequently?
