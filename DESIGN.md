# Design System — Gatopolis

<!-- impeccable:design-schema 1 -->

## Visual World

**Direction:** Modern + Bold (Linear / Vercel tier)
**Mode:** Operate (task-completion interface)
**Tone:** Professional, confident, minimal. Premium SaaS that respects the operator's time.

## Typography

**Family:** Inter (Google Fonts, weights 400–800)
**Base size:** 14px, line-height 1.6, letter-spacing -0.011em
**Headings:** letter-spacing -0.025em, line-height 1.2

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 2xl (24px) | 700 | Page titles |
| Title | lg (18px) | 600 | Section headers |
| Subtitle | sm (14px) | 600 | Card/panel headers |
| Body | sm (14px) | 400 | Content text |
| Caption | xs (12px) | 500 | Labels, metadata, timestamps |
| Micro | [11px] | 500 | Nav group labels, uppercase tracking |

## Color Palette

### Surfaces
| Token | Value | Use |
|-------|-------|-----|
| `background` | #fafafa | App background |
| `surface` | #ffffff | Cards, panels |
| `surface-raised` | #ffffff | Elevated panels |
| `surface-sunken` | #f4f4f5 | Inputs, hover states |

### Sidebar (dark)
| Token | Value | Use |
|-------|-------|-----|
| `sidebar` | #09090b | Sidebar background |
| `sidebar-hover` | #18181b | Hover state |
| `sidebar-active` | #27272a | Active item |
| `sidebar-muted` | #a1a1aa | Group labels |

### Brand
| Token | Value | Use |
|-------|-------|-----|
| `primary` | #0f766e | Actions, links, brand accent |
| `primary-hover` | #0d9488 | Hover state |
| `primary-subtle` | #ccfbf1 | Light background |
| `accent` | #6366f1 | Secondary accent (categorization) |

### Semantic
| Token | Value | Use |
|-------|-------|-----|
| `success` | #10b981 | Active, positive, CER complete |
| `warning` | #f59e0b | Incidents, monitoring |
| `danger` | #ef4444 | Urgent, errors, closed |
| `info` | #3b82f6 | Informational |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `text` | #09090b | Primary text |
| `text-secondary` | #52525b | Secondary text |
| `text-muted` | #a1a1aa | Disabled, placeholders |
| `text-inverse` | #fafafa | Text on dark surfaces |

## Spacing & Layout

- **Border radius:** xl (12px) for cards/panels, lg (8px) for buttons/inputs, md (6px) for small elements
- **Border:** 1px solid `border` (#e4e4e7) — single border, never doubled with shadow
- **Elevation:** None by default. Use border-only cards. Shadow only for overlays (dropdowns, modals)
- **Content max-width:** 7xl (max-w-7xl) for main content areas
- **Grid gaps:** 3-4 (12-16px) for tight grids, 6 (24px) for section separation

## Icons

- **Style:** SVG, stroke-based, 1.5px stroke-width, round cap/join
- **Sizes:** 18px in navigation, 16px inline, 14px in metadata
- **Color:** Inherits from parent via `currentColor`
- **No emojis.** All icons are authored SVG paths.

## Components

### Cards
- White surface, 1px border, xl radius
- No colored top/left borders
- Hover: border transitions to `primary/30`
- Content padding: p-5

### Buttons
- Primary: `bg-primary text-white`, lg radius, medium font
- Secondary: `bg-text text-text-inverse`
- Ghost: transparent, hover `bg-surface-sunken`
- Size: px-4 py-2.5 for standard, px-3 py-2 for compact

### Form Inputs
- `bg-background border-border`, lg radius
- Focus: `ring-2 ring-primary/20 border-primary`
- Label: sm font-medium text-secondary, mb-1.5

### Status Badges
- Dot + label pattern (colored dot + text)
- Rounded-md, compact padding (px-2 py-0.5)
- Background at 8% opacity of the status color

## Navigation

- Dark sidebar (240px desktop, 280px mobile overlay)
- Grouped by function: General, Gestión, Programas, Equipo
- Group labels: 11px uppercase tracking-wider, muted color
- Items: 13px, 2.5px gap with 18px icon
- Active: solid background (sidebar-active), white text, font-medium
- Settings isolated at bottom

## Light/Dark Decision

**Light mode principal** — optimized for outdoor field use (sun, high ambient light). The dark sidebar provides premium contrast and helps separate navigation from content without a full dark theme.

## Anti-patterns Banned

Per craft-floor:
- No emojis as icons
- No border-top/left >1px on cards
- No gradient text
- No system display fonts
- No hero-metric template repetition
- No glass/blur decoration
- No kickers/eyebrows above headings
