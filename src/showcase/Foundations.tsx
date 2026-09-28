import { Icon } from '../design-system/Icon'
import { For } from 'solid-js'
import type { Copy } from './copy'
const colors = ['#F8F6F1', '#EFECE5', '#D8D0C3', '#28251F', '#A74832']
export function Colors(props: { t: Copy; notify: (message: string) => void }) {
  async function copyColor(color: string) {
    try { await navigator.clipboard.writeText(color); props.notify(`${props.t.copied}: ${color}`) }
    catch { props.notify(props.t.copyFailed) }
  }
  return <>
    <div class="subsection-header"><h3>{props.t.colors}</h3><span>{props.t.colorHelp}</span></div>
    <div class="palette"><For each={colors}>{(color, index) => <button class="swatch" onClick={() => void copyColor(color)} aria-label={`${props.t.colorNames[index()]} ${color}`}><span class="swatch-color" style={{ background: color }}><Icon name="copy" size={16} /></span><span class="swatch-label">{props.t.colorNames[index()]}<code>{color}</code></span></button>}</For></div>
  </>
}
export function Typography(props: { t: Copy }) {
  return <>
    <div class="type-grid"><div class="type-specimen"><span class="eyebrow">{props.t.typography}</span><div class="type-letters">Aa<span>&</span></div><h3>{props.t.typeTitle}</h3><p>{props.t.typeBody}</p><div class="type-families"><span><b>Newsreader</b><small>{props.t.display}</small></span><span><b>Manrope</b><small>{props.t.body}</small></span><span><b>Geist Mono</b><small>{props.t.mono}</small></span></div></div><div class="type-scale"><span class="eyebrow">{props.t.scale}</span><For each={[[props.t.scaleLabels[0], '64', 'Aa'], [props.t.scaleLabels[1], '48', 'Aa'], [props.t.scaleLabels[2], '36', 'Aa'], [props.t.scaleLabels[3], '24', 'Aa'], [props.t.scaleLabels[4], '16', props.t.typeTitle], [props.t.scaleLabels[5], '12', props.t.crafted]]}>{item => <div class="scale-row"><code>{item[0]}<small>{item[1]} / px</small></code><span style={{ 'font-size': `${item[1]}px` }} class={Number(item[1]) >= 24 ? 'serif' : ''}>{item[2]}</span></div>}</For></div></div>
  </>
}
export function Spacing(props: { t: Copy }) {
  return <>
    <div class="spacing-panel"><div><h3>{props.t.spacing}</h3><p>{props.t.spacingBody}</p></div><div class="spacing-bars"><For each={[4, 8, 12, 16, 24, 32, 48, 64]}>{space => <div><span style={{ height: `${space}px` }} /><code>{space}</code></div>}</For></div></div>  </>
}
