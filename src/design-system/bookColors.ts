export interface ColorPreset {
  readonly id: string
  readonly label: string
  readonly hex: string
}

export const BOOK_COLOR_PRESETS: readonly ColorPreset[] = [
  { id: 'terracotta', label: 'Terracotta', hex: '#a74832' },
  { id: 'forest', label: 'Forest', hex: '#2d4a3e' },
  { id: 'navy', label: 'Navy', hex: '#2e3a59' },
  { id: 'amber', label: 'Amber', hex: '#8a4f20' },
  { id: 'plum', label: 'Plum', hex: '#5a3d5c' },
  { id: 'slate', label: 'Slate', hex: '#3d5a5b' },
  { id: 'charcoal', label: 'Charcoal', hex: '#373b3e' },
  { id: 'ochre', label: 'Ochre', hex: '#9c723a' },
]

export function getBookColor(explicitColor?: string | null, seed?: string | number): string {
  if (explicitColor && explicitColor.trim().length > 0) {
    return explicitColor.trim()
  }
  if (!seed) {
    return BOOK_COLOR_PRESETS[0]!.hex
  }
  const str = String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  const index = hash % BOOK_COLOR_PRESETS.length
  return BOOK_COLOR_PRESETS[index]!.hex
}
