import { createSignal, Show, type JSX } from 'solid-js'
import './book.css'

export interface BookProps {
  title: string
  coverImage?: string
  coverPosition?: string
  variant?: 'stripe' | 'simple'
  width?: number
  color?: string
  textColor?: string
  textured?: boolean
  rotated?: boolean
  icon?: JSX.Element
  illustration?: JSX.Element
}

export function Book(props: BookProps) {
  const [failedImage, setFailedImage] = createSignal<string>()
  return (
    <div class="ds-book" classList={{ 'ds-book-simple': props.variant === 'simple', 'ds-book-colored': !!props.color, 'ds-book-textured': props.textured, 'ds-book-rotated': props.rotated }}
      style={{ '--book-width': `${props.width ?? 196}px`, '--book-color': props.color, '--book-text': props.textColor }}>
      <div class="ds-book-rotate">
        <div class="ds-book-cover">
          <Show when={props.variant !== 'simple'}>
            <div class="ds-book-stripe" aria-hidden="true"><div class="ds-book-illustration">{props.illustration}</div>
              <Show when={props.coverImage && failedImage() !== props.coverImage}>
                <img class="ds-book-image" src={props.coverImage} alt="" loading="lazy" decoding="async" style={{ 'object-position': props.coverPosition ?? 'center' }} onError={() => setFailedImage(props.coverImage)} />
              </Show><div class="ds-book-bind" /></div>
          </Show>
          <div class="ds-book-body">
            <div class="ds-book-bind" aria-hidden="true" />
            <div class="ds-book-content">
              <h3 class="ds-book-title">{props.title}</h3>
              <div class="ds-book-icon" aria-hidden="true">{props.variant === 'simple' ? props.illustration ?? props.icon : props.icon}</div>
            </div>
          </div>
          <Show when={props.textured}><div class="ds-book-texture" aria-hidden="true" /></Show>
        </div>
        <div class="ds-book-pages" aria-hidden="true" />
        <div class="ds-book-back" aria-hidden="true" />
      </div>
    </div>
  )
}
