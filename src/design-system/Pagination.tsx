import { For, Show } from 'solid-js'
import { Button } from './primitives'
import { Icon } from './Icon'

export interface PaginationProps {
  readonly page: number
  readonly total?: number
  readonly limit?: number
  readonly totalPages?: number
  readonly onChange: (page: number) => void
  readonly label?: string
  readonly previous?: string
  readonly next?: string
}

export function Pagination(props: PaginationProps) {
  const getTotalPages = (): number => {
    if (typeof props.totalPages === 'number') {
      return Math.max(1, props.totalPages)
    }
    if (typeof props.total === 'number' && typeof props.limit === 'number' && props.limit > 0) {
      return Math.max(1, Math.ceil(props.total / props.limit))
    }
    return Math.max(1, props.page ?? 1)
  }

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const totalPages = getTotalPages()
    const current = Math.min(Math.max(1, props.page), totalPages)

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = [1]

    if (current > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(totalPages - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
    return pages
  }

  const navLabel = () => props.label ?? 'Pagination'
  const prevLabel = () => props.previous ?? 'Previous page'
  const nextLabel = () => props.next ?? 'Next page'

  const visualIndex = () => Math.max(0, getPageNumbers().findIndex((item) => item === props.page))

  return (
    <nav class="pagination" aria-label={navLabel()} style={{ '--page-index': visualIndex() }}>
      <Button
        variant="ghost"
        disabled={props.page <= 1}
        aria-label={prevLabel()}
        onClick={() => props.onChange(props.page - 1)}
      >
        <Icon name="arrowLeft" size={16} />
      </Button>

      <For each={getPageNumbers()}>
        {(item) => (
          <Show
            when={item !== 'ellipsis'}
            fallback={<span class="pagination-ellipsis" aria-hidden="true">…</span>}
          >
            <Button
              variant="ghost"
              aria-label={`${navLabel()} ${item}`}
              aria-current={props.page === item ? 'page' : undefined}
              class={props.page === item ? 'active' : ''}
              onClick={() => props.onChange(item as number)}
            >
              {item}
            </Button>
          </Show>
        )}
      </For>

      <Button
        variant="ghost"
        disabled={props.page >= getTotalPages()}
        aria-label={nextLabel()}
        onClick={() => props.onChange(props.page + 1)}
      >
        <Icon name="arrowRight" size={16} />
      </Button>
    </nav>
  )
}
