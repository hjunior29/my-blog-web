import { createSignal, For, Show } from 'solid-js'
import { Icon } from '../design-system/Icon'
import { Button } from '../design-system/primitives'
import { Examples, type ExampleProps } from './Examples'
import { catalogCopy, catalogGroups, catalogHref, type CatalogId } from './content'
import './catalog.css'

type CatalogProps = Omit<ExampleProps, 'id' | 'compact'> & { page: CatalogId | 'overview' }
export function Catalog(props: CatalogProps) {
  const [search, setSearch] = createSignal('')
  const c = () => catalogCopy(props.locale)
  const groups = () => catalogGroups.map(items => items.filter(id => c().entries[id][0]!.toLocaleLowerCase().includes(search().trim().toLocaleLowerCase())))
  return <div class="catalog-layout">
    <aside class="catalog-sidebar"><label class="sr-only" for="catalog-search">{c().search}</label><div class="catalog-search"><Icon name="search" size={16} /><input id="catalog-search" type="search" placeholder={c().search} value={search()} onInput={event => setSearch(event.currentTarget.value)} /></div>
      <nav aria-label={c().navigation}><a class="catalog-overview-link" href={catalogHref('overview')} aria-current={props.page === 'overview' ? 'page' : undefined}>{c().overview}<Icon name="arrowUpRight" size={16} /></a>
        <For each={groups()}>{(items, index) => <Show when={items.length}><div class="catalog-nav-group"><span class="eyebrow">{[c().foundations, c().components, c().editorial][index()]}</span><For each={items}>{id => <a href={catalogHref(id)} aria-current={props.page === id ? 'page' : undefined}>{c().entries[id][0]}</a>}</For></div></Show>}</For>
        <Show when={groups().every(items => !items.length)}><div class="catalog-search-empty"><p>{c().noResults}</p><Button variant="ghost" onClick={() => setSearch('')}>{c().clear}</Button></div></Show>
      </nav>
    </aside>
    <div class="catalog-mobile-nav"><label for="catalog-page">{c().navigation}</label><select id="catalog-page" value={props.page} onChange={event => { location.hash = catalogHref(event.currentTarget.value) }}><option value="overview">{c().overview}</option><For each={catalogGroups}>{(group, index) => <optgroup label={[c().foundations, c().components, c().editorial][index()]}><For each={group}>{id => <option value={id}>{c().entries[id][0]}</option>}</For></optgroup>}</For></select></div>
    <main id="main" class="catalog-main" tabindex="-1"><header class="catalog-page-heading"><div class="breadcrumbs"><a href={catalogHref('overview')}>{props.t.system}</a><Icon name="chevronRight" size={16} /><span>{props.page === 'overview' ? c().overview : c().entries[props.page][0]}</span></div><h1 tabindex="-1">{props.page === 'overview' ? c().overview : c().entries[props.page][0]}</h1><p>{props.page === 'overview' ? c().introduction : c().entries[props.page][1]}</p></header>
      <Show when={props.page !== 'overview'} fallback={<For each={catalogGroups}>{(group, index) => <div class="catalog-overview-group"><h2 class="catalog-group-title">{[c().foundations, c().components, c().editorial][index()]}</h2><For each={group}>{id => <section class="catalog-overview-item"><div class="catalog-item-heading"><h3>{c().entries[id][0]}</h3><a class="text-link" href={catalogHref(id)} aria-label={`${c().browse}: ${c().entries[id][0]}`}>{c().browse}<Icon name="arrowUpRight" size={16} /></a></div><Examples {...props} id={id} compact /></section>}</For></div>}</For>}>
        <Show when={props.page} keyed>{page => <Examples {...props} id={page as CatalogId} />}</Show>
      </Show>
    </main>
  </div>
}
