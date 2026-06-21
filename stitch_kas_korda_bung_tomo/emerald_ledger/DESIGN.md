---
name: Emerald Ledger
colors:
  surface: '#0e1511'
  surface-dim: '#0e1511'
  surface-bright: '#343b36'
  surface-container-lowest: '#09100c'
  surface-container-low: '#161d19'
  surface-container: '#1a211d'
  surface-container-high: '#242c27'
  surface-container-highest: '#2f3632'
  on-surface: '#dde4dd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dde4dd'
  inverse-on-surface: '#2b322d'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#45dfa4'
  on-secondary: '#003825'
  secondary-container: '#00bd85'
  on-secondary-container: '#00452e'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#0e1511'
  on-background: '#dde4dd'
  surface-variant: '#2f3632'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  numeric-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered for a high-performance financial SaaS environment, prioritizing precision, speed, and executive-level clarity. The aesthetic is rooted in **Modern Minimalism** with a **Premium Dark** execution, drawing inspiration from high-fidelity developer tools and fintech interfaces.

The brand personality is authoritative yet approachable, evoking a sense of absolute financial control and technological sophistication. By utilizing a "Dark Mode First" strategy, we reduce cognitive load for users managing dense data over long periods. Visual interest is generated through subtle micro-interactions, high-contrast typography for fiscal data, and surgical use of emerald accents to highlight growth and success.

## Colors

The palette is anchored by a deep obsidian background (`#0B1220`) to establish a premium foundation. Surfaces use a slightly lighter slate (`#111827`) to create perceived depth without the need for heavy shadows. 

**Emerald Green** serves as the primary action color, signaling financial health and successful transactions. **Secondary Mint** is used for decorative accents and secondary data visualizations. Warning and Danger colors are reserved strictly for high-priority alerts and critical financial discrepancies. Text hierarchy is maintained by contrasting pure white for primary information against a muted blue-grey for metadata and descriptions.

## Typography

This design system uses a triple-font approach to balance personality with utility. **Plus Jakarta Sans** is used for headlines to provide a modern, slightly rounded warmth. **Inter** handles the bulk of body copy and forms due to its exceptional legibility and neutral tone. **Geist** (a technical mono-influenced sans) is utilized for labels and financial figures to ensure tabular data remains perfectly aligned and easy to scan.

Financial numbers must always use the `numeric-lg` or `display-xl` roles when representing primary balances. All labels for data points should use the `label-caps` style to distinguish them clearly from the values they describe.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with a strictly enforced 4px baseline shift. Most container widths are determined by a 12-column system on desktop, collapsing to a single column on mobile devices.

- **Desktop (1280px+):** 12 columns, 24px gutters, 40px side margins.
- **Tablet (768px - 1279px):** 8 columns, 20px gutters, 24px side margins.
- **Mobile (<767px):** 4 columns, 16px gutters, 16px side margins.

Horizontal spacing between elements should be consistent with the `stack` tokens. For financial dashboards, white space is used aggressively to separate disparate data modules, preventing the "wall of numbers" effect.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines**. In this dark-themed environment, we avoid traditional drop shadows in favor of subtle border treatments and inner glows.

- **Level 0 (Background):** `#0B1220` - The base canvas.
- **Level 1 (Cards/Sidebar):** `#111827` - Surface containers with a 1px border of `rgba(255,255,255,0.05)`.
- **Level 2 (Modals/Popovers):** `#1F2937` - Floating elements with a more pronounced border `rgba(255,255,255,0.1)` and a subtle `0 20px 40px rgba(0,0,0,0.4)` shadow.

Interactive elements use a soft hover glow of the primary color at 5% opacity to indicate focus without breaking the minimalist aesthetic.

## Shapes

The design system utilizes **Rounded** shapes to soften the technical nature of financial data. A standard 0.5rem (8px) radius is applied to all primary containers and input fields.

- **Small elements (Checkboxes, Tags):** 4px radius.
- **Standard elements (Buttons, Inputs, Cards):** 8px radius.
- **Large elements (Modals, Featured Sections):** 16px radius.
- **Circular elements (Avatars, Icon Backgrounds):** Full pill (999px).

## Components

### Buttons
- **Primary:** Solid `#10B981` with white text. High-contrast, bold weight.
- **Secondary:** Transparent with `#10B981` 1px border. Transitions to 10% emerald fill on hover.
- **Ghost:** No border or background. Text only, using `text-secondary`.
- **Danger:** Solid `#EF4444`. Reserved for destructive actions (e.g., Delete Transaction).

### Data Tables
Tables are the heart of the system. They feature no vertical borders. Rows have a subtle hover state (`#1F2937`). Headers use `label-caps` typography. Negative financial values are colored in Danger red, positive in Primary emerald.

### Statistic Cards
Large numeric values (`numeric-lg`) at the top, with a small sparkline chart or a percentage badge (`Status Badge`) in the corner indicating period-over-period growth.

### Forms & Inputs
Inputs use a dark fill (`#0B1220`) with a 1px border. The border turns Primary emerald when focused. Labels always sit above the input using `body-sm` bold.

### Navigation
- **Sidebar:** Collapsible, using icons and labels. The active state is indicated by a vertical 3px emerald bar on the left edge.
- **Bottom Nav:** Exclusive to mobile, featuring 4-5 key actions with 24px line-art icons.

### Status Badges
Small, pill-shaped tags with a subtle 10% background tint of the status color and a 100% opacity text color (e.g., Success badge is 10% emerald background with 100% emerald text).