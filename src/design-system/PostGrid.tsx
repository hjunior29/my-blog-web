import { For } from 'solid-js'
import { PostCard } from './editorial'
import './post-grid.css'

export type PostPreview = { title: string; description: string; category: string; date: string; readingTime: string; coverImage?: string }

export function PostGrid(props: { posts: PostPreview[]; onOpen: (trigger: HTMLElement, index: number) => void }) {
  return <div class="post-grid"><For each={props.posts}>{(post, index) => <PostCard {...post} onOpen={trigger => props.onOpen(trigger, index())} />}</For></div>
}
