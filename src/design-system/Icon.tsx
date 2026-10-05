import {
  Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Asterisk, Bell, Bold, BookOpen,
  Bookmark, Check, ChevronRight, CircleAlert, Code, Copy, Download, Edit3, ExternalLink, Eye, EyeOff,
  FileText, Heading, Image, Inbox, Italic, List, LoaderCircle, Moon, Music, Pause, Play, Plus, Printer, Quote, RotateCw,
  Search, Share2, Sun, Trash2, Triangle, Upload, Video, X, ZoomIn,
} from 'lucide-solid'
import { Dynamic } from 'solid-js/web'

export const iconSet = {
  archive: Archive, arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight, asterisk: Asterisk, bell: Bell, bold: Bold, bookOpen: BookOpen,
  bookmark: Bookmark, check: Check, chevronRight: ChevronRight, circleAlert: CircleAlert,
  code: Code, copy: Copy, download: Download, edit: Edit3, externalLink: ExternalLink,
  eye: Eye, eyeOff: EyeOff, fileText: FileText, heading: Heading, image: Image, inbox: Inbox, italic: Italic,
  list: List, loader: LoaderCircle, moon: Moon, music: Music, plus: Plus, quote: Quote, retry: RotateCw,
  search: Search, share: Share2, sun: Sun, trash: Trash2, triangle: Triangle, upload: Upload, video: Video,
  print: Printer, close: X, x: X, play: Play, pause: Pause, zoomIn: ZoomIn,
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
