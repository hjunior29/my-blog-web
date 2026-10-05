# Book visual study

Reference: https://vercel.com/geist/book, inspected September 26, 2026.

This is a local SolidJS reproduction, not an official Vercel package or affiliation. The Book catalog page presents local cover variants using the blog identity. Editorial posts now compose Book through PostCard, while portfolio cards retain their existing layout.

## API

```tsx
<Book
  title={copy.title}
  variant="stripe"
  width={196}
  color="var(--accent)"
  icon={<PersonalMark />}
/>
```

| Prop | Behavior |
| --- | --- |
| coverImage | Optional decorative post image in the upper stripe. Lazy-loaded; a failed image falls back to the stripe color. |
| coverPosition | CSS object-position for image cropping; defaults to center. |
| title | Required localized title, rendered once as an h3. |
| variant | `stripe` by default; `simple` fills the cover with content. |
| width | Preferred width in pixels, default 196; shrinks to its container. |
| color | Stripe color, or full cover color for the simple variant. |
| textColor | Explicit text color override; otherwise follows the theme. |
| textured | Enables the reference cover texture and detailed paper edge. |
| rotated | Holds the 3D pose for touch devices and visual comparison. |
| icon | Decorative footer mark for a stripe cover; fallback for a simple cover. |
| illustration | Decorative stripe artwork, or artwork below a simple title. |

## Fidelity

Measured geometry: 49:60 aspect ratio, 900 px perspective, 29% book depth, 8.2% binding width, 6.1% content padding, and 6/4 px corner radii. Hover rotates -20 degrees, scales to 1.066, and translates -8 px over 250 ms. Geist 600 is scoped to cover titles. The stripe reference measures 196 × 240 px with a 114.641 px stripe and 125.359 px content body at the default English title.

Binding and page-light gradients are a deliberate, component-scoped exception to the project's flat-surface rule, required for this requested reproduction. The catalog uses localized blog titles, the terracotta accent, and the personal mark.

This study does not claim pixel-perfect parity across browsers. Font rasterization, page background, and theme context affect the rendered result. The catalog layout uses the existing design system.

## Texture provenance

`public/textures/book-texture.avif` is the public texture served by the reference page:
https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/design/book-texture.avif

It is retained locally for the requested visual comparison, without claiming authorship or a redistribution license. It loads only when the texture option is enabled. Reference marks and wording are identified as comparison material in the visible catalog.

## Accessibility and motion

Covers are presentational content, not inert buttons. The native toggle controls make the 3D pose available by keyboard and touch. Artwork, binding, and page geometry are hidden from assistive technology; the title remains semantic text. Hover motion is disabled for reduced-motion users, while the explicit pose toggle remains available without animation. PostCard supplies a descriptively named native button with a visible focus ring.

## Verification

Production build and TypeScript checks pass. Browser checks covered default dimensions, rotation and texture controls, dark theme, and a 390 px viewport without document overflow. The scoped axe audit reported no automatic violations; contrast over texture and transformed text requires visual review.

## Editorial posts

PostCard uses a 248 px cover (about 27% larger than the reference), blog typography, and semantic theme colors. The title is on the cover; category, description, date, and reading time sit below. A transparent native button covers the book without removing its heading semantics, supports Enter/Space, and starts the article transition. Hover and keyboard focus reveal the same 3D pose.

The Book page compares image and color-only covers; the article shelf alternates both variants. Its local SVG cover is an original decorative illustration. Post images use object-fit cover and do not affect layout while loading.


## Article transition

`transitionBookToArticle(source, reveal, signal, label)` clones the clicked Book at its current position and 3D pose. It continues the rotation (170 ms), opens the original cover around the left spine to 180 degrees (380 ms), holds the spread (80 ms), then zooms into the right page (330 ms). The normal ArticlePage appears beneath a final 90 ms fade. Cover images and colors are retained from the source Book.

The animation uses native Web Animations and a temporary dialog in the top layer, without another library. Transform and opacity drive the animation. The book stays at its original position while opening, then zooms to fill the viewport. Both inner pages keep light paper (#f8f6f1) and dark ink (#28251f) in either theme, with decorative text lines that fade during the zoom. The full sequence takes about 1.05 seconds. Escape cancels, AbortSignal supports navigation cleanup, and reduced-motion users go directly to the article. Temporary nodes, animations, scroll locks, and source visibility are cleaned up when complete or canceled.

The catalog opens its sample article at `#article` and returns to the originating component page. ArticlePage uses the existing editorial typography and surfaces, with optional image, author, metadata, prose, and a return action. Book geometry exists only during the transition. The app restores heading focus after entry and post-button focus after return.

## Return transition

`transitionArticleToBook({ slug, href, label, navigate, restoreFocus })` plays the opening in reverse. Paper covers the article (120 ms), the page shrinks into the open spread centered on screen (340 ms), the spread holds (60 ms), the cover closes while the Book turns to -32 degrees (380 ms), and the Book slides into its shelf slot while settling flat (440 ms). The dimmed backdrop fades out during the final slide.

The opening transition remembers the clicked Book: slug, shelf path, scroll position, size, and a styled snapshot. PostCard marks each stage with `data-book-slug`. On return, the snapshot animates immediately while the shelf loads underneath; the transition restores the remembered scroll position and centers the Book if it would be hidden. Without a snapshot, as after a direct visit, it waits up to 1.8 s for the shelf and clones the Book from there. If the Book never appears, the overlay fades out over the shelf.

`navigate` must not scroll; the transition owns scrolling. The scroll lock reserves the scrollbar gutter so the landing position does not shift. Escape skips to the shelf, reduced-motion users navigate directly, and `restoreFocus` moves focus to the Book action after keyboard activation.

## Reading ribbon

`BookmarkRibbon` hangs below the public header on the article page and descends as the article is read. Progress runs from the article top reaching the header to the article bottom reaching the viewport bottom. One band moves with `translate3d`, driven by a single custom property in the shared scroll-scene frame; the swallowtail keeps its shape because the band slides instead of scaling. The ribbon is decorative and hidden from assistive technology.

