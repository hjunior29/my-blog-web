# Helder design system

An editorial foundation for a personal blog and portfolio. The homepage opens the component catalog overview. Each component has its own page under `#/design-system/<id>`. Run `bun run dev` to explore it and `bun run build` to type-check and build production assets.

## Visual direction

Warm paper, dark ink, and one terracotta accent. Newsreader provides editorial expression, Manrope handles interface text, and Geist Mono identifies metadata and code. Fonts currently load through Google Fonts with swap and system fallbacks. Illustrations are CSS compositions with a small SVG noise texture; no image library is required.

The serif is a deliberate extension of the supplied article's font suggestions: it contrasts with the interface sans and gives long-form writing its own voice. Green is reserved for success feedback, not brand emphasis. No decorative gradients, italic styles, fabricated endorsements, or weights above 700. The Book component uses scoped gradients to reproduce physical binding and page lighting.

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
| Skeleton | Loading placeholder with gentle vertical motion and staggered line breathing; accepts paused and an accessible label. |
| Accordion | Accessible button disclosure with aria-expanded, inert collapsed content, and reversible grid expansion. |
| Presence | Retains conditional content through exit; accepts when and scale/slide/fade preset. |
| Dialog | Controlled open prop, onClose after exit. Native modal with localized labels, unique title association, Escape/backdrop dismissal, and caller-managed focus restoration. |
| Toast | Polite live notification with a dismiss action. The caller owns its duration. |
| NotebookArt | Two animated CSS illustrations: notebook and correspondence, regular or compact. Requires a localized motionLabel for its pause control. |
| PaperZoomScene | Scroll-linked home scene. `intro` stays pinned while a paper sheet travels in from the lower left, grows into a full-height page (`--paper-sheet-width`, 920 px by default), scrolls its `children`, and leaves toward the lower right. The page keeps fixed paper colors; its sides show the theme background. Takes `label`, optional `mark`, and `static`. Following content slides under its exit. |
| LetterScene | Scroll-linked correspondence scene. An envelope turns over, breaks its wax seal, opens, and delivers a tri-fold letter that unfolds in 3D. Takes `opening`, `body`, and `closing` panel slots, optional `heading`, envelope labels, and `static`. Focus inside the letter scrolls to its unfolded state. |
| PostGrid | Responsive article shelf: three columns on wide screens, two on medium screens, one on phones. Accepts posts and onOpen(trigger, index); composes PostCard with its original Book interaction. |
| PostCard | Clickable 248 px book cover with optional coverImage/coverPosition, title, category, description, metadata, and onOpen callback. |
| ProjectCard | Portfolio specimen with descriptive onOpen action. |
| Author | Name, monogram avatar, and short biography. |
| Quote | Editorial quotation with caption, never a fabricated testimonial. |

## Composition and behavior

`src/catalog` owns the grouped navigation, search, localized page descriptions, and component specimens. `content.ts` registers pages, `Examples.tsx` renders their shared examples, and `Catalog.tsx` composes individual pages and the overview. The overview uses a compact specimen per entry, while individual pages expose variants and states. No code snippets or duplicated promotional sections are rendered. `src/showcase` retains the shared dictionaries and foundation/icon specimens. All inputs and feedback are local demonstrations; no data is sent.

Use semantic header, main, and footer siblings. Preserve visible focus, associated form labels, keyboard controls, dialog Escape behavior, focus restoration, and reduced-motion behavior. Hash routes support direct links and browser history. Navigation focuses the page heading; returning from reading restores the previous catalog position and trigger. Native dialog handles focus containment and the top layer.

At 760 px the searchable sidebar becomes a grouped native page selector. At 640 px paired foundation specimens stack. Use balanced headings, comfortable paragraph widths, and intrinsic layout before adding breakpoints.

## Adding a component

Create and document the reusable component here before consuming it. Register a bilingual page in `src/catalog/content.ts` and its specimen in `Examples.tsx`; it automatically appears in the overview. Add examples and cover relevant focus, hover, active, disabled, loading, empty, and error states. Keep files below 500 lines. Never add agent configuration to this repository.

## Icon standard: Lucide

Use `Icon` from `./Icon` for all interface icons. The official `lucide-solid` package is the single icon dependency: https://lucide.dev/guide/solid. The icon catalog is available at `#/design-system/icons`.

```tsx
<Icon name="arrowRight" size={16} />
<Button aria-label={copy.close}><Icon name="close" /></Button>
```

Default size is 20 px and stroke width is 1.75 px. Supported sizes are 16, 20, 24, 32, and 48 px. Color inherits from the parent. Icons are decorative and hidden from assistive technology; use visible labels or a localized aria-label on the parent control. Never use an icon alone to communicate a status.

Add named imports to the explicit registry in `Icon.tsx` when needed. Do not import the complete Lucide namespace or use a whole-library dynamic loader. Do not introduce Unicode action glyphs or hand-drawn interface icons. Brand wordmarks, monograms, and editorial illustrations remain artwork and are not replaced by generic icons. Book artwork and monograms remain scoped to the editorial identity.


## Motion standard

Import `motion.css` once in the app shell. New components must use these tokens instead of arbitrary durations: `--motion-fast` (120 ms) for interaction feedback, `--motion-enter` (180 ms) and `--motion-exit` (120 ms) for presence. Use `--ease-standard`, `--ease-enter`, and `--ease-exit` for their corresponding phases. No bounce or overshoot. The explicitly requested illustration and loading loops are limited to their own components, with pause controls in the catalog.

Use `Presence when={visible()}` for conditional surfaces that need both entry and exit. Presets: `scale` (96% to 100%, centered), `slide` (6 px), and `fade` (opacity only). Keep changing content available until exit finishes. The component handles animation cancellation, rapid reversals, cleanup, and makes exiting content inert. Do not wrap Presence itself in a conditional, which would skip its exit.

Use `animatePresence` for native surfaces with their own lifecycle. Dialog retains its native focus trap and backdrop until exit completes, then closes and calls onClose. Control it through open; do not remove it before exit or call the native close method externally. Close buttons, Escape, backdrop clicks, and programmatic open=false share the same animation. Restore trigger focus in onClose.

Buttons, links, fields, navigation, filters, and toggles share short state transitions. Accordions expand and collapse with a reversible grid-row transition and fade; inline feedback has a small entry fade. Toast uses the slide preset for both entry and exit. Focus indicators appear immediately. Reduced-motion preferences skip presence animations and CSS transitions, without delaying closure or hiding content. Prefer opacity and transform; avoid transition: all, permanent will-change, unrelated layout animation, scroll reveals, and global page entrance animations. The Book reading transition remains a deliberately separate interaction.

PaperZoomScene and LetterScene are the only scroll-linked exceptions, limited to the home page. They pin a stage with native `position: sticky` and share one passive scroll listener (`scrollScene.ts`) that reads layout once per frame, then writes transforms only. `will-change` is applied only while the paper is moving. Set `--scene-top` to the height of any sticky header above them. Reduced motion renders both as static, fully readable layouts.


## Catalog routes

- `#/design-system/overview`: the complete system with one compact specimen per component.
- `#/design-system/book`: book cover variants, texture, and rotation controls.
- `#/design-system/post-grid`: the six-article shelf with reading transitions.
- `#/design-system/<id>`: individual foundation or component from the registry.

Legacy `#books` and `#editorial` links resolve to Book and the article shelf. Unknown routes show the overview. The catalog supports PT/EN, light/dark themes, keyboard navigation, and mobile page selection. The UI contains no code view.


Pagination uses a shared 180 ms sliding selection indicator; current-page semantics and disabled boundaries update immediately. Accordion uses an intrinsic 0fr/1fr grid transition so dynamic content and viewport changes remain responsive. This small disclosure is an intentional exception to transform-only motion. Closed content is inert and hidden from assistive technology, including during exit.

Skeleton moves vertically by 3 px over 1.8 seconds; line lengths and opacity breathe with staggered timing. `paused` freezes the entire loader. NotebookArt is an intentionally expressive exception to restrained UI motion: 5.4–10.8 second loops separate and rotate the paper layers, orbit decorative dots, spin the mark, and lift the letter from its moving envelope. Controls and other components retain their restrained motion. `variant="correspondence"` introduces the envelope composition; the default preserves the notebook. Each illustration has its own aria-pressed pause control outside the decorative artwork. Reduced motion disables all of these animations, including the pagination pseudo-element, without changing content or interactions.
