import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Asterisk, Bell, Bold, BookOpen,
  Bookmark, Check, ChevronRight, CircleAlert, Code, Copy, Download, Edit3, ExternalLink, Eye, EyeOff,
  FileText, Heading, Inbox, Italic, List, LoaderCircle, Moon, Pause, Play, Plus, Printer, Quote, RotateCw,
  Search, Share2, Sun, Trash2, Triangle, Upload, X,
} from 'lucide-solid'
import { Dynamic } from 'solid-js/web'

export const iconSet = {
  arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight, asterisk: Asterisk, bell: Bell, bold: Bold, bookOpen: BookOpen,
  bookmark: Bookmark, check: Check, chevronRight: ChevronRight, circleAlert: CircleAlert,
  code: Code, copy: Copy, download: Download, edit: Edit3, externalLink: ExternalLink,
  eye: Eye, eyeOff: EyeOff, fileText: FileText, heading: Heading, inbox: Inbox, italic: Italic,
  list: List, loader: LoaderCircle, moon: Moon, plus: Plus, quote: Quote, retry: RotateCw,
  search: Search, share: Share2, sun: Sun, trash: Trash2, triangle: Triangle, upload: Upload,
  print: Printer, close: X, x: X, play: Play, pause: Pause,
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
