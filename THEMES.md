# Portfolio themes

Published portfolios (the Canvas and Spotlight layouts, and the case study pages) can be switched between 16 themes. The owner picks one in the builder (Profile card, "Theme" row). The choice is stored in `profiles.theme` and applied on the public pages. The default is `light`, which is the original look.

## Files

| File | Role |
| --- | --- |
| `lib/themes.ts` | Theme ids, labels, picker swatches, `resolveTheme()`. Single source of truth for ids. |
| `app/themes.css` | Token defaults (the `light` theme), the `.pxp-*` component classes, and one token block per theme. |
| `components/published/ThemeScope.tsx` | Wraps a published page in `<div class="pxp" data-pxtheme="…">`. Every token hangs off this element, so nothing outside a portfolio is restyled. |
| `components/published/Marquee.tsx` | Scrolling strip. Second copy is `aria-hidden`; reduced motion turns it into a static list. |
| `components/builder/ThemePicker.tsx` | Editor control: disclosure button plus a radiogroup with arrow-key navigation. |
| `app/api/profile/route.ts` | `PATCH` accepts `theme` and rejects unknown ids with 400. |
| `supabase/migrations/20261101000000_profile_theme.sql` | Adds `profiles.theme` with a check constraint. |
| `scripts/audit-theme-contrast.mjs` | WCAG AA audit (`npm run audit:themes`). |
| `app/dev/themes` | Dev-only gallery: every theme and layout on fixture data (`/dev/themes?theme=glass&layout=spotlight`). Returns 404 in production. |

## How a theme works

1. Components (`.pxp-card`, `.pxp-btn`, …) only read tokens. Themes only write tokens.
2. There are two token layers:
   - `--px-*` are the legacy tokens. They always match the page background, so pages that have not been migrated (the case study body) stay readable in every theme.
   - `--t-*` are semantic tokens for themed components. Text on panels (`--t-on-surface*`) is separate from text on the page (`--px-text*`, `--t-on-hero*`), so a dark page with light panels needs no workarounds.
3. A few themes add decoration (gears, tape, rivets, corner brackets) with pseudo-element rules at the end of their block. These are normal class selectors. There is no `!important` in `themes.css`.
4. `light` has no block. It is the base values at the top of `themes.css`.

## Add a theme

1. Add an entry to `THEMES` and `THEME_IDS` in `lib/themes.ts`.
2. Add a `.pxp[data-pxtheme="<id>"]` block to `app/themes.css`. Set the legacy `--px-*` tokens first, then the `--t-*` tokens that differ from light. Always set the flat `--t-page-solid`, `--t-surface-solid` and, where a gradient or translucent colour is used, the matching `--t-*-solid` worst-case colour.
3. Add the id to the check constraint (new migration, and `supabase/schema.sql`).
4. Run `npm run audit:themes` and fix any failing pair.
5. Look at it in `/dev/themes` at desktop and phone width.

## Rollout order

1. Apply `supabase/migrations/20261101000000_profile_theme.sql` to the database.
2. Deploy the code.

The public pages read `theme` in a separate, error-tolerant query and fall back to `light`, so a missing column never breaks a portfolio. The builder save does fail until the migration is applied.

## Behaviour notes

- Dark themes (`chrome`, `steampunk`, `neon`) set their own page and text colours. Light and dark are part of the theme choice, not a separate switch.
- Under `prefers-reduced-motion`, scrolling strips stop and wrap into a static list, and theme animations (chrome sheen, steampunk gears) do not run.
- Under 640px wide, `backdrop-filter` is turned off in every theme.
- The preview page (`/preview`) has its own theme picker. It changes the preview only and does not save.
- Print uses whichever theme is selected.

## Known gaps

- The default `light` theme fails WCAG AA for secondary text (about 2.7:1 for `--px-text-3`) and for white text on the `#e53416` accent (4.3:1). The audit lists these as known baseline and does not fail on them, because changing `light` is a product decision.
- The audit checks tokens with flat stand-in colours. Gradient and translucent surfaces use a worst-case colour chosen by hand.
- Not yet checked: Safari and Firefox rendering, a real device for blur and animation cost.

## Designer scene (Expressive motion)

At **Expressive**, a 20 second looping illustration sits under the hero buttons: a chibi-style character sketches a flow on a whiteboard, has an idea, walks to her desk, designs a screen on her laptop, cheers, and walks back.

- Component: `components/scene/DesignerScene.tsx` (inline SVG). Its stylesheet `designer-scene.css` is generated, so edit `scripts/gen-designer-scene-css.py` (the timeline: one skeleton, per-joint keyframes) and run `python3 scripts/gen-designer-scene-css.py`.
- Outfit and accents follow the theme accent colour, so it fits every theme.
- It plays only while on screen. With reduced motion it shows one still frame (seated at the desk, board filled).
- It is loaded with `next/dynamic` and only rendered at Expressive. The stylesheet is a separate chunk (about 65 KB, 5.5 KB gzipped).
- Dev only: `/dev/scene?theme=<id>&freeze=0..1` pins a moment of the loop; add `&clean` for just the scene.
- The scene adds about 400px to the hero, so at Expressive the work starts lower on the page than at Subtle.

