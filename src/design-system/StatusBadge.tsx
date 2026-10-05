import type { PostStatus } from '../lib/api/types.ts'

export interface StatusBadgeProps {
  readonly status: PostStatus
  readonly label?: string
}

export function StatusBadge(props: StatusBadgeProps) {
  const getFallbackLabel = (): string => {
    switch (props.status) {
      case 'draft':
        return 'Draft'
      case 'published':
        return 'Published'
      case 'archived':
        return 'Archived'
      default:
        return props.status
    }
  }

  return (
    <span class={`badge status-badge status-${props.status}`} data-status={props.status}>
      {props.label ?? getFallbackLabel()}
    </span>
  )
}
