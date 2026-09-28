import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Asterisk, Bell, BookOpen,
  Bookmark, Check, ChevronRight, CircleAlert, Copy, Edit3, ExternalLink, Eye, EyeOff,
  FileText, Inbox, LoaderCircle, Moon, Pause, Play, Plus, Printer, Quote, RotateCw,
  Search, Share2, Sun, Trash2, Triangle, X,
} from 'lucide-solid'
import { Dynamic } from 'solid-js/web'

export const iconSet = {
  arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight, asterisk: Asterisk, bell: Bell, bookOpen: BookOpen,
  bookmark: Bookmark, check: Check, chevronRight: ChevronRight, circleAlert: CircleAlert,
  copy: Copy, fileText: FileText, inbox: Inbox, loader: LoaderCircle, moon: Moon,
  plus: Plus, quote: Quote, retry: RotateCw, search: Search, sun: Sun, triangle: Triangle,
  close: X, x: X, play: Play, pause: Pause, eye: Eye, eyeOff: EyeOff,
  trash: Trash2, edit: Edit3, share: Share2, print: Printer, externalLink: ExternalLink,
}

export type IconName = keyof typeof iconSet

export function Icon(props: { name: IconName; size?: number; class?: string }) {
  return (
    <Dynamic
      component={iconSet[props.name]}
      size={props.size ?? 20}
      strokeWidth={1.75}
      class={`ds-icon ${props.class ?? ''}`}
      aria-hidden="true"
    />
  )
}
