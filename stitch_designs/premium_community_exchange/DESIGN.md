---
name: Premium Community Exchange
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
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
  tertiary: '#004641'
  on-tertiary: '#ffffff'
  tertiary-container: '#006059'
  on-tertiary-container: '#83d9cf'
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
  tertiary-fixed: '#9cf2e8'
  tertiary-fixed-dim: '#80d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is anchored in a **Premium Humanist** aesthetic, tailored for a community skill-sharing platform. The objective is to facilitate high-trust exchanges by blending the efficiency of a modern SaaS tool with the warmth of a community center. 

The style utilizes a **Sophisticated Minimalist** approach: high-end geometric shapes are softened by humanist typography and organic color accents. This removes the cold, transactional feel of traditional marketplaces, replacing it with an inviting, editorial atmosphere. The UI relies on generous white space and a precise typographic hierarchy to ensure the focus remains on the human skills being shared.

## Colors
The palette is designed to distinguish between platform mechanics and community value.

- **Primary Deep Teal (#0b6057):** Used for structural elements, primary actions, and navigational anchors. It represents the stability and professional quality of the platform.
- **Secondary Ochre (#d97706):** Reserved exclusively for "Social Currency" elements—Time Credits, Hours Shared, and Star Ratings. This warm tone signals value without the aggressive connotations of financial "green."
- **Surfaces:** A warm off-white (`#f8fafc`) serves as the canvas, while pure white (`#ffffff`) is used for elevated containers to create a subtle but clear distinction between the background and active content.
- **Typography:** Deep Slate (`#0f172a`) ensures maximum readability for headers, while Medium Slate (`#475569`) provides a softer contrast for long-form body descriptions.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels. Its modern geometric structure, paired with subtle humanist curves, makes it exceptionally legible for both densly packed skill lists and large, welcoming headlines.

- **Headers:** Use tight letter spacing for large display sizes to maintain a premium, editorial look.
- **Body:** Line heights are set to 1.6 to ensure readability for skill descriptions and community bios.
- **Labels:** Small caps or increased letter spacing should be used for secondary labels (like "Skill Category") to differentiate them from interactive body text.

## Layout & Spacing
The layout follows a **Fluid Grid System** with strict adherence to an 8px spacing rhythm.

- **Desktop:** 12-column grid with 24px gutters and a 1280px max-width container.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px margins.

Padding within cards and containers should be generous (minimum 24px/`lg`) to maintain the "Spacious SaaS" feel. Content-heavy areas, such as Skill Directories, should utilize asymmetrical layouts—giving more prominence to the skill imagery or creator bio while keeping metadata secondary.

## Elevation & Depth
The system uses **Tonal Layering** combined with **Ambient Shadows** to create a high-end feel.

- **Level 0 (Background):** Warm off-white (`#f8fafc`), flat.
- **Level 1 (Cards/Containers):** Pure white (`#ffffff`) with a 1px border (`#e2e8f0`) and a very soft, diffused shadow (0px 2px 4px rgba(15, 23, 42, 0.04)).
- **Level 2 (Hover/Active):** Increased shadow depth (0px 10px 20px rgba(15, 23, 42, 0.08)) and a slight upward translation (2px) to provide tactile feedback during interaction.
- **Level 3 (Modals/Overlays):** Heavy blur backdrop (8px) to focus the user on the skill-sharing agreement or profile setup.

## Shapes
In alignment with the "Premium" visual identity, the design system employs **Pill-shaped (3)** geometry. 

- **Primary Buttons & Inputs:** Use a 1rem (16px) base radius.
- **Cards:** Use `rounded-xl` (3rem/48px relative or 12px absolute as per user preference) to create a friendly, approachable container.
- **Tags/Chips:** Always fully pill-shaped to denote they are interactive, non-structural elements.

This softened geometry works in tandem with the Teal color to make the platform feel like a safe, community-governed space rather than a rigid corporate tool.

## Components

### Buttons
- **Primary:** Solid Teal (`#0b6057`) with white text. Pill-shaped. Heavy horizontal padding (24px).
- **Secondary:** Transparent with Teal border and text. Used for less urgent actions like "View Profile."
- **Tertiary:** Subtle Ochre (`#d97706`) background with dark text, specifically for "Give Time Credits" to highlight the social currency.

### Cards
Skill cards are the core component. They feature a pure white background, 12px rounded corners, and a 1px Slate border. Content is divided into a header (User Bio/Skill Name) and a footer (Time Credit Cost), separated by a subtle 1px divider.

### Chips & Badges
- **Skill Tags:** Light Teal background with Deep Teal text. 
- **Time Credit Badges:** Soft Amber background with dark Ochre text. These should feature a small "clock" or "star" icon to reinforce the non-monetary theme.

### Inputs
Input fields use a 1px `#e2e8f0` border that transitions to a 2px Teal border on focus. Background remains white. Labels are always positioned above the input in `body-sm` Bold Slate.

### Skill-Sharing Agreement (Special Component)
A specialized "Transaction" component that summarizes the "Skill Exchange." It uses a dual-tone background (Teal top, White bottom) to distinguish between the two participants in the swap, emphasizing equality and reciprocity.