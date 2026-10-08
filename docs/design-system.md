# FlowPilot AI — Design System Specification

## Overview & Design Philosophy

FlowPilot AI is built with a refined, professional, and cohesive business software interface. It prioritizes readability, functional clarity, and deliberate spacing over decorative AI effects or engineering jargon.

---

## 1. Color Palette & Semantic Tokens

### Base Palette
| Token | Hex | Role | Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#FAFAF8` | Canvas / Page Background | Main background for app dashboard and marketing pages |
| `--surface` | `#FFFFFF` | Surface / Card Background | Cards, tables, modals, sidebars, elevated panels |
| `--foreground` | `#18181B` | Primary Text | Headings, labels, metric values, high-contrast text |
| `--muted` | `#52525B` | Secondary Text | Supporting copy, timestamps, table subheaders |
| `--border` | `#E4E4E7` | Standard Border | Card outlines, dividers, input borders |
| `--primary` | `#4F46E5` | Primary Action | Brand accent, primary buttons, active state indicators |
| `--primary-hover` | `#4338CA` | Action Hover | Primary button hover and interactive focus rings |

### Semantic Status Tokens
Status colors are reserved strictly for meaningful system states and metrics:
- **Success / Completed / Active**: Emerald (`#059669` / `#ECFDF5` background)
- **Warning / Waiting / Paused**: Amber (`#D97706` / `#FFFBEB` background)
- **Error / Failed / Destructive**: Red (`#DC2626` / `#FEF2F2` background)
- **Neutral / Draft / Skipped**: Zinc (`#71717A` / `#F4F4F5` background)
- **Brand / In-Flight / Running**: Indigo (`#4F46E5` / `#EEF2FF` background)

---

## 2. Typography

FlowPilot AI uses **Geist Sans** as its primary typeface across all marketing, dashboard, navigation, and CRM interfaces. **Geist Mono** is reserved exclusively for technical payloads, identifiers, code examples, and tabular metric numerals.

### Scale & Hierarchy
- **Marketing Hero Title**: 48px – 64px (`text-5xl md:text-6xl font-extrabold tracking-tight`)
- **Marketing Section Headings**: 30px – 36px (`text-3xl font-bold tracking-tight`)
- **Dashboard Page Titles**: 28px – 32px (`text-2xl font-bold tracking-tight`)
- **Card / Subsection Headings**: 16px – 18px (`text-base font-semibold`)
- **Marketing Body Copy**: 16px (`text-base leading-relaxed text-zinc-600`)
- **Application Body Copy**: 14px (`text-sm text-zinc-700`)
- **Secondary & Meta Text**: 12px – 13px (`text-xs text-zinc-500`)
- **Metrics & Numbers**: Tabular numbers (`tabular-nums font-bold tracking-tight`)

---

## 3. Spacing, Radii & Grid System

- **Grid Unit**: 8px base spacing (`gap-2` = 8px, `gap-4` = 16px, `gap-6` = 24px, `gap-8` = 32px).
- **Marketing Container Width**: Max `1200px` (`max-w-6xl mx-auto px-4 sm:px-6`).
- **Dashboard Sidebar Width**: `240px` (`w-60 shrink-0`).
- **Dashboard Content Padding**: `24px` to `32px` (`p-6 md:p-8`).
- **Card Border Radius**: `10px` – `12px` (`rounded-xl`).
- **Input & Button Radius**: `6px` – `8px` (`rounded-lg`).
- **Input & Button Height**: `40px` (`h-10 px-4 py-2 text-sm`). Small variants: `36px` (`h-9 px-3 text-xs`).

---

## 4. Shared UI Primitives

All components are located in `src/components/ui/` and adhere to semantic design tokens:

1. **Button (`button.tsx`)**:
   - `default` (`bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm`)
   - `secondary` (`bg-zinc-100 hover:bg-zinc-200 text-zinc-900`)
   - `outline` (`border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700`)
   - `ghost` (`hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900`)
   - `destructive` (`bg-red-600 hover:bg-red-700 text-white`)

2. **Badge (`badge.tsx`)**:
   - `default` / `primary` (Indigo tint)
   - `success` (Emerald tint)
   - `warning` (Amber tint)
   - `destructive` (Red tint)
   - `secondary` / `muted` (Zinc tint)

3. **Card (`card.tsx`)**:
   - White surface (`bg-white`), subtle zinc border (`border border-zinc-200`), subtle shadow (`shadow-sm`), `rounded-xl`.

4. **PageHeader (`page-header.tsx`)**:
   - Standardizes page title, descriptive subtitle, and primary action slot across all dashboard views.

5. **MetricCard (`metric-card.tsx`)**:
   - High-contrast value with tabular numerals, secondary reporting period description, optional trend badge.

6. **Dialog (`dialog.tsx`)**:
   - Accessible modal overlay with backdrop blur, keyboard `Escape` dismissal, focus isolation, and light container.

7. **EmptyState (`empty-state.tsx`)**:
   - Clean icon badge, clear heading, informative guidance, and primary action CTA.

---

## 5. Screen Guidelines & Layout Conventions

### Landing Page (`/`)
- Two-column hero with practical UI visual card demonstrating lead intake → AI qualification → CRM upsert → follow-up alert.
- Verified integration strip ("Works with" OpenAI, Resend, Slack, Webhooks).
- Product walkthrough showcasing visual workflow builder capabilities.
- Benefit sections using alternating previews and concise business copy.
- 3 workflow templates, reliability architecture summary, business FAQ, and footer.

### Dashboard Shell (`/overview`, `/workflows`, `/leads`, `/runs`, `/integrations`, `/settings`)
- 240px clean light sidebar with active tint (`bg-indigo-50 text-indigo-700 font-semibold`).
- Workspace selector at top, user profile and sign out at bottom.
- Concise sandbox notice for demo mode: *"Demo mode — actions use sample integrations."* with 1-click synthetic data reset.
- Real operational metrics: Leads captured, Active workflows, Successful runs, Failed runs.
- Onboarding checklist derived dynamically from live workspace records.

### Workflow Canvas (`/workflows/[id]`)
- Visual canvas with white node cards, clean connector handles, true/false branch badges, node palette, inspector panel, test runner modal, and live run status overlays.

---

## 6. Accessibility & Responsiveness

- **Contrast**: All text color combinations meet WCAG AA standards against `#FAFAF8` and `#FFFFFF`.
- **Keyboard Navigation**: Focus rings (`focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600`) on all interactive controls.
- **Breakpoints**: Verified at 375px (mobile), 768px (tablet), 1440px (desktop), and 1920px (ultrawide).
- **Transitions**: Subtle 150ms–200ms transitions without continuous decorative animations.
- **Motion**: Respects `prefers-reduced-motion`.
