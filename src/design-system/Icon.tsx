import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Asterisk, Bell, BookOpen, Bookmark, Check, ChevronRight, CircleAlert, Copy, FileText, Inbox, LoaderCircle, Moon, Plus, Quote, RotateCw, Search, Sun, Triangle, X } from 'lucide-solid'
import { Dynamic } from 'solid-js/web'

export const iconSet = {
  arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight, asterisk: Asterisk, bell: Bell, bookOpen: BookOpen,
  bookmark: Bookmark, check: Check, chevronRight: ChevronRight, circleAlert: CircleAlert,
  copy: Copy, fileText: FileText, inbox: Inbox, loader: LoaderCircle, moon: Moon,
  plus: Plus, quote: Quote, retry: RotateCw, search: Search, sun: Sun, triangle: Triangle, close: X,
}
export type IconName = keyof typeof iconSet

export function Icon(props: { name: IconName; size?: 16 | 20 | 24 | 32 | 48; class?: string }) {
  return <Dynamic component={iconSet[props.name]} size={props.size ?? 20} strokeWidth={1.75} class={`ds-icon ${props.class ?? ''}`} aria-hidden="true" />
}
