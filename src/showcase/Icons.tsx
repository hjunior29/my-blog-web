import { For } from 'solid-js'
import { Icon, iconSet, type IconName } from '../design-system/Icon'
import type { Copy } from './copy'

export function Icons(props: { t: Copy }) {
  return <div class="icon-specimen"><div class="subsection-header"><h3>{props.t.iconTitle}</h3><a class="text-link" href="https://lucide.dev/" target="_blank" rel="noreferrer">Lucide<Icon name="arrowUpRight" size={16} /></a></div><p>{props.t.iconDescription}</p><div class="icon-gallery"><For each={Object.keys(iconSet) as IconName[]}>{name => <div><Icon name={name} /><code>{name}</code></div>}</For></div></div>
}
