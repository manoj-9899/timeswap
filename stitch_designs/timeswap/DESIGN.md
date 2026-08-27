---
name: TimeSwap
colors:
  surface: '#ffffff'
  surface-dim: '#d8dbd9'
  surface-bright: '#f7faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f2'
  surface-container: '#eceeec'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e0e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2d3130'
  inverse-on-surface: '#eff1ef'
  outline: '#6f7977'
  outline-variant: '#bec9c6'
  surface-tint: '#1b6960'
  primary: '#00473f'
  on-primary: '#ffffff'
  primary-container: '#0b6057'
  on-primary-container: '#90d8cc'
  inverse-primary: '#8cd4c8'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#642f1b'
  on-tertiary: '#ffffff'
  tertiary-container: '#804530'
  on-tertiary-container: '#ffbaa3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a8f0e4'
  primary-fixed-dim: '#8cd4c8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#380d01'
  on-tertiary-fixed-variant: '#6f3723'
  background: '#fcfdfd'
  on-background: '#191c1b'
  surface-variant: '#e0e3e1'
  on-surface-subtle: '#515f5d'
  border-subtle: '#e2e8f7'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  section-padding: 80px
  card-padding: 24px
---

## Brand & Style

The design system is engineered for a **Modern SaaS** execution, specifically tailored for a high-converting landing page and platform experience. The brand personality is rooted in "Immediate Trust"—combining the professional reliability of a fintech tool with the vibrant, human-centric nature of a community exchange.

The visual style follows a **Safe** identity: a balanced execution that prioritizes high-legibility typography, familiar layout patterns, and a polished, professional atmosphere. By utilizing the Deep Teal as a foundation for stability and the Soft Amber as a conversion-focused accent, the UI signals both maturity and momentum. The overall aesthetic is clean, structured, and optimized for rapid information processing and clear calls to action.

## Colors

The color strategy is designed to drive user conversion and clarify platform mechanics through high contrast and purposeful application.

- **Primary Deep Teal (#0b6057):** The core brand anchor. It is used for primary navigation, headers, and the most critical action buttons to establish authority and trust.
- **Secondary Soft Amber (#d97706):** A high-visibility accent color. It is strictly reserved for "value markers"—conversion buttons, notification badges, and social currency indicators (Time Credits). Its warmth contrasts sharply against the teal to guide the eye toward "swap" opportunities.
- **Neutral Palette:** The system uses a nearly-white background (`#fcfdfd`) to keep the interface feeling fresh and expansive. Surface containers use pure white with very subtle borders to create depth without relying on heavy shadows.

## Typography

This design system leverages **Plus Jakarta Sans** for its contemporary, crisp appearance. The typeface provides the geometric precision required for a SaaS environment while its subtle curves maintain the approachability of a peer-to-peer exchange.

The typographic hierarchy is intentionally dramatic for the desktop landing page, utilizing large `display-lg` sizes for value propositions to ensure high impact. Body text is set with generous line heights (1.6) to facilitate effortless reading of user bios and skill descriptions. For functional labels and metadata, a slightly increased letter spacing is applied to maintain clarity at smaller sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the desktop experience, centering content within a 1200px max-width container to maintain a controlled, premium reading experience.

- **Grid Model:** A standard 12-column system with 24px gutters. Content should be grouped into logical blocks (e.g., 4-column cards or 6-column feature splits).
- **Rhythm:** An 8px linear scale is used for all internal component spacing, ensuring vertical rhythm is maintained across the page.
- **Sectioning:** Large vertical gaps (80px to 120px) are used between landing page sections to prevent cognitive overload and reinforce the "Modern SaaS" feeling of space and quality.

## Elevation & Depth

To maintain a "Safe" and professional aesthetic, hierarchy is established through **Low-contrast Outlines** and **Ambient Shadows**.

- **Surface Tiering:** The background is the lowest level. Content cards sit on Level 1, utilizing a pure white surface and a 1px border in `border-subtle`.
- **Shadow Profile:** Shadows are extremely diffused and low-opacity (4-8%). They are used sparingly, primarily to indicate interactivity on hover or to lift primary modals and dropdown menus. 
- **Interactive State:** Upon hover, cards should transition from a flat border to a soft ambient shadow, providing a tactile lift effect that encourages clicks without appearing heavy or dated.

## Shapes

The design system utilizes **Rounded (2)** geometry to balance professional structure with modern friendliness.

- **Standard Elements:** Buttons, input fields, and small containers use a 0.5rem (8px) base radius. This provides a clean, "app-like" appearance that feels current.
- **Large Components:** Cards and major content containers use 1rem (16px) or 1.5rem (24px) for a softer, more inviting frame.
- **Interactive Accents:** Small UI elements like tags and status badges may utilize a full pill-shape to distinguish them from structural, rectangular components.

## Components

### Buttons
- **Primary Hero:** Deep Teal (#0b6057) solid fill with white text. High-contrast and bold.
- **Secondary/Conversion:** Soft Amber (#d97706) solid fill. Reserved for "Swap Now" or "Get Started" CTAs.
- **Ghost:** Transparent background with a Teal 1px outline. Used for secondary navigation or "Learn More" links.

### Input Fields
Inputs are clean with a 1px border. On focus, the border transitions to a 2px Deep Teal stroke. Labels are placed above the field in `label-lg` style using a subtle slate color.

### Value Cards
The primary vehicle for the landing page. Feature a 1px `border-subtle`, 16px rounded corners, and generous 24px internal padding. They should include a clear distinction between the "offered" skill and the "requested" time.

### Time-Credit Badges
Small, pill-shaped markers using a light tint of Soft Amber with dark Amber text. These act as the "Social Currency" indicator, often accompanied by a small clock icon.

### Navigation Bar
A fixed top bar with a blur backdrop (Glassmorphism effect) to maintain context while scrolling. It should feature the logo on the left and a prominent Teal "Join TimeSwap" button on the right.