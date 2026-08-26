---
name: Nourish
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#a43a3a'
  on-tertiary: '#ffffff'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  metric-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  section-gap: 40px
---

## Brand & Style

The design system is built on a foundation of **Modern Minimalism with a Tonal Editorial** influence. It targets health-conscious individuals in Ethiopia who value precision, intelligence, and a premium aesthetic. The UI must feel like a high-end concierge service—uncluttered, intentional, and authoritative.

The aesthetic avoids generic tech "brightness" in favor of a sophisticated, high-contrast palette that feels "expensive." It leverages generous whitespace and a strict grid to evoke a sense of calm and control over one's health. Visual interest is driven by high-quality photography of Ethiopian cuisine and bold numerical data, rather than decorative UI flourishes.

## Colors

The palette is anchored by **Dark Charcoal (#1A1A1A)** for text and primary structural elements, providing a deep, ink-like contrast against the **Warm Off-White (#FAF9F6)** background. 

- **Emerald Green (#10B981):** Used exclusively for "Nourishment" indicators—success states, calorie progress, and primary action buttons.
- **Amber (#F59E0B):** Reserved for moderate alerts, cautionary nutritional data (e.g., high sodium), or highlighting specific micro-goals.
- **Surface Neutrals:** Use subtle shifts of the off-white background (e.g., 2-4% darker) to create containment without introducing heavy borders.

## Typography

This design system utilizes **Inter** for its exceptional legibility and systematic feel. The type hierarchy emphasizes numerical data (metrics), which should be rendered with tighter letter-spacing to feel impactful.

- **Display & Headlines:** Use Charcoal for all headings. Ensure large sizes have negative letter-spacing for a sophisticated, editorial look.
- **Metrics:** Use `metric-xl` for calorie counts and macronutrient totals.
- **Labels:** Use `label-caps` for category headers like "BREAKFAST" or "TRADITIONAL SIDES" to provide a clear structural anchor.
- **Body:** Maintain a comfortable 1.5x line height for readability in longer nutritional descriptions.

## Layout & Spacing

The layout follows a **Fixed-Width Grid** on desktop (max 1200px) and a fluid 4-column grid on mobile. 

- **Generous Breathing Room:** Use a base 8px scale. Sections should be separated by `section-gap` (40px) to maintain the premium feel.
- **Margins:** A standard 24px margin is required on mobile to prevent the UI from feeling cramped.
- **Data Density:** While the overall aesthetic is airy, nutritional tables and ingredient lists should use tighter spacing (8px) to remain functional during meal logging.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and extremely **Soft Ambient Shadows**. 

- **Level 0 (Background):** #FAF9F6.
- **Level 1 (Cards/Containers):** Pure white (#FFFFFF) with a subtle 4px blur shadow, 4% opacity Charcoal.
- **Level 2 (Modals/Overlays):** Pure white with a 12px blur shadow, 8% opacity Charcoal.
- **Glassmorphism:** Use sparingly for bottom navigation bars or sticky headers—a `backdrop-filter: blur(10px)` with 80% opacity of the background color creates a modern, layered effect without looking overly "techy."

## Shapes

The shape language is defined by **Sophisticated Large Radii**. 

- **Primary Containers:** 16px to 24px corner radius. This softens the high-contrast "Charcoal/White" palette, making the app feel more human and approachable.
- **Buttons:** 12px radius. Avoid full-pill shapes to maintain a more architectural, professional look.
- **Input Fields:** 12px radius with a subtle 1px inset border in a light neutral.
- **Images:** All food photography (Injera, Doro Wot) must feature the same 24px radius as primary cards to integrate into the layout seamlessly.

## Components

- **Primary Buttons:** Solid Emerald Green background with white text. High-contrast, 12px rounded corners. Use for "Add Entry" or "Save."
- **Nutritional Chips:** Small, semi-transparent green or amber backgrounds with high-contrast text. Used to label "High Protein" or "Traditional."
- **Metric Cards:** Large cards containing a single `metric-xl` value, a `label-caps` descriptor, and a thin circular progress bar in Emerald Green.
- **Input Fields:** Minimalist design; off-white background with a Charcoal border that thickens on focus. Use "Inter" for input text to ensure numbers are clear.
- **List Items (Food Log):** High-contrast text on a white surface. Use small thumbnails for food items with a 8px radius.
- **Progress Bars:** Use a thick (8px) stroke for macronutrient tracks, with a rounded cap and a neutral track color only 5% darker than the background.