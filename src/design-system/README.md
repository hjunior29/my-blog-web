# Helder design system

An editorial foundation for a personal blog and portfolio. The homepage is the live component catalog. Run `bun run dev` to explore it and `bun run build` to type-check and build production assets.

## Visual direction

Warm paper, dark ink, and one terracotta accent. Newsreader provides editorial expression, Manrope handles interface text, and Geist Mono identifies metadata and code. Fonts currently load through Google Fonts with swap and system fallbacks. Illustrations are CSS compositions with a small SVG noise texture; no image library is required.

The serif is a deliberate extension of the supplied article's font suggestions: it contrasts with the interface sans and gives long-form writing its own voice. Green is reserved for success feedback, not brand emphasis. No decorative gradients, italic styles, fabricated endorsements, or weights above 700. The isolated Book reference study uses scoped gradients to reproduce physical binding and page lighting.

## Tokens

`src/index.css` owns semantic colors, fonts, the 12/14/16/18/24/36/48/64 type scale, the 4/8/12/16/24/32/48/64 spacing scale, radii, elevation, and stacking layers. Light and dark themes use the same semantic names. Paper illustration colors intentionally remain fixed across themes.

Use `--paper` for the page, `--surface` to group content, `--raised` for inputs, `--ink` for primary text, `--muted` for supporting text, and `--accent` for interactive emphasis. Borders use `--border`. Do not use palette sand as body text.

## Components

| Component | Purpose and API |
| --- | --- |
| Book | Isolated Geist visual study with stripe/simple covers, 3D hover, optional texture, and custom artwork. See [BOOK.md](./BOOK.md). |
| ArticlePage | Editorial reading layout with localized metadata, optional cover image, prose children, and onBack action. |
| transitionBookToArticle | Native Book opening and zoom transition with cancellation and reduced-motion fallback. See [BOOK.md](./BOOK.md). |
| Button | Native button attributes; primary, secondary, ghost variants; small/default/large sizes; busy and disabled states. Provide a localized accessible name for icon-only buttons. |
| Arrow | Decorative direction indicator; optional diagonal direction. |
| Badge | Neutral or accent metadata. Not interactive. |
| Section | Named catalog section with id, number, title, and description. |
| Field | Label and hint/error association. The child control must use the supplied id and reference `{id}-hint` through aria-describedby when a hint exists. |
| Toggle | Controlled native checkbox switch with label, checked, and onChange. |
| Pagination | Controlled four-page specimen with localized labels and disabled boundaries. |
| Alert | Static success/error feedback; dynamic content should use a live region. |
| EmptyState | Context, explanation, and a recovery action supplied as children. |
| Skeleton | Static loading placeholder with an accessible label. |
| Accordion | Native details/summary disclosure with keyboard support. |
| Dialog | Native modal with localized labels, unique title association, Escape/backdrop dismissal, and caller-managed focus restoration. |
| Toast | Polite live notification with a dismiss action. The caller owns its duration. |
| NotebookArt | Decorative CSS illustration, regular or compact. |
| PostGrid | Responsive article shelf: three columns on wide screens, two on medium screens, one on phones. Accepts posts and onOpen(trigger, index); composes PostCard with its original Book interaction. |
| PostCard | Clickable 248 px book cover with optional coverImage/coverPosition, title, category, description, metadata, and onOpen callback. |
| ProjectCard | Portfolio specimen with descriptive onOpen action. |
| Author | Name, monogram avatar, and short biography. |
| Quote | Editorial quotation with caption, never a fabricated testimonial. |

## Composition and behavior

`src/showcase` contains the live specimens and PT/EN dictionaries. The app shell provides section navigation, locale/theme controls, notification delivery, and native dialog previews. Forms are local demos; they never send or store email addresses. Pagination and category buttons expose controlled state without pretending to fetch articles. Article/project text is explicitly labeled demonstration content.

Use semantic header, main, and footer siblings. Preserve visible focus, associated form labels, keyboard controls, dialog Escape behavior, focus restoration, and reduced-motion behavior. Navigation uses IntersectionObserver rather than a scroll listener. Native dialog handles focus containment and the top layer.

At 960 px the sidebar becomes horizontally scrollable navigation. At 640 px paired specimens stack. Use balanced headings, comfortable paragraph widths, and intrinsic layout before adding breakpoints.

## Adding a component

Create and document the reusable component here before consuming it. Add a bilingual specimen on the homepage and cover relevant focus, hover, active, disabled, loading, empty, and error states. Keep files below 500 lines. Never add agent configuration to this repository.

## Icon standard: Lucide

Use `Icon` from `./Icon` for all interface icons. The official `lucide-solid` package is the single icon dependency: https://lucide.dev/guide/solid. The catalog is visible in the Components section.

```tsx
<Icon name="arrowRight" size={16} />
<Button aria-label={copy.close}><Icon name="close" /></Button>
```

Default size is 20 px and stroke width is 1.75 px. Supported sizes are 16, 20, 24, 32, and 48 px. Color inherits from the parent. Icons are decorative and hidden from assistive technology; use visible labels or a localized aria-label on the parent control. Never use an icon alone to communicate a status.

Add named imports to the explicit registry in `Icon.tsx` when needed. Do not import the complete Lucide namespace or use a whole-library dynamic loader. Do not introduce Unicode action glyphs or hand-drawn interface icons. Brand wordmarks, monograms, and editorial illustrations remain artwork and are not replaced by generic icons. The Book comparison uses Lucide Triangle in place of the original inline triangle mark.
