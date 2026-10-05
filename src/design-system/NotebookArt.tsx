import { Icon } from './Icon'
import './illustration.css'

export interface NotebookArtProps {
  readonly compact?: boolean
  readonly variant?: 'notebook' | 'correspondence'
  readonly motionLabel?: string
}

export function NotebookArt(props: NotebookArtProps) {
  return (
    <div class="illustration">
      <div class={`notebook-art ${props.compact ? 'compact' : ''} ${props.variant === 'correspondence' ? 'art-correspondence' : ''}`} aria-hidden="true">
        <div class="art-orbit"><span class="art-satellite" /><span class="art-satellite secondary" /></div><div class="art-paper paper-back" />
        <div class="art-paper paper-front"><span class="paper-mark">h.</span><div class="paper-lines"><i /><i /><i /><i /></div><span class="paper-asterisk"><Icon name="asterisk" size={48} /></span><span class="paper-bottom">NOTES & IDEAS<br />VOL. 01 / 2026</span></div>
        {props.variant === 'correspondence' && <><div class="art-envelope"><span /></div><div class="art-stamp"><Icon name="asterisk" size={24} /></div></>}
        <div class="art-caption">A WORK IN PROGRESS</div><span class="art-coordinate">23° S / 46° W</span>
      </div>
    </div>
  )
}
