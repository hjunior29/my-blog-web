import type { MarkdownSyntax } from '../../design-system'

export function formatMarkdownInsertion(
  current: string,
  start: number,
  end: number,
  syntax: MarkdownSyntax,
): { nextValue: string; cursor: number } {
  const selection = current.substring(start, end) || 'text'
  let insertion = ''

  switch (syntax) {
    case 'bold':
      insertion = `**${selection}**`
      break
    case 'italic':
      insertion = `*${selection}*`
      break
    case 'heading':
      insertion = `\n### ${selection}\n`
      break
    case 'quote':
      insertion = `\n> ${selection}\n`
      break
    case 'code':
      insertion = selection.includes('\n')
        ? `\n\`\`\`\n${selection}\n\`\`\`\n`
        : `\`${selection}\``
      break
    case 'list':
      insertion = `\n- ${selection}\n`
      break
    case 'link':
      insertion = `[${selection}](https://)`
      break
    default:
      insertion = selection
  }

  const nextValue = current.substring(0, start) + insertion + current.substring(end)
  const cursor = start + insertion.length

  return { nextValue, cursor }
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readMarkdownFile(file: File, onLoad: (text: string) => void): void {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result
    if (typeof text === 'string') {
      onLoad(text)
    }
  }
  reader.readAsText(file)
}
