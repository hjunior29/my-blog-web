import { For, type JSX } from 'solid-js'
import { PostCard, type PostCardProps } from './editorial'
import './post-grid.css'

export type PostPreview = PostCardProps

export interface PostGridProps<T = PostCardProps> {
  readonly posts: readonly T[]
  readonly onOpen?: (trigger: HTMLElement, index: number) => void
  readonly renderItem?: (post: T, index: number) => JSX.Element
}

export function PostGrid<T extends PostCardProps = PostCardProps>(props: PostGridProps<T>) {
  return (
    <div class="post-grid">
      <For each={props.posts}>
        {(post, index) => {
          if (props.renderItem) {
            return props.renderItem(post, index())
          }
          return (
            <PostCard
              {...post}
              onOpen={props.onOpen ? (trigger) => props.onOpen?.(trigger, index()) : post.onOpen}
            />
          )
        }}
      </For>
    </div>
  )
}
