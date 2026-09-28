import type { Locale } from '../showcase/copy'

export const catalogIds = ['colors', 'typography', 'spacing', 'motion', 'icons', 'button', 'badge', 'field', 'toggle', 'pagination', 'accordion', 'alert', 'empty', 'skeleton', 'dialog', 'toast', 'book', 'post', 'post-grid', 'project', 'author', 'quote', 'artwork', 'article'] as const
export type CatalogId = typeof catalogIds[number]
const pt = {
  overview: 'Visão geral', introduction: 'As peças que dão forma ao blog. Explore cada componente ou veja o sistema completo nesta página.',
  foundations: 'Fundamentos', components: 'Componentes', editorial: 'Editorial', search: 'Encontrar componente', noResults: 'Nenhum componente encontrado.', clear: 'Limpar busca', browse: 'Explorar componente', navigation: 'Navegar pelo design system',
  pauseMotion: 'Pausar animação', notebook: 'Caderno de ideias', correspondence: 'Cartas e descobertas',
  default: 'Padrão', variants: 'Variações', states: 'Estados', sizes: 'Tamanhos', interaction: 'Interação', image: 'Com imagem', simple: 'Capa simples', texture: 'Textura',
  entries: {
    colors: ['Cores', 'Papel, tinta e terracota. Uma paleta de neutros quentes com um único acento.'],
    typography: ['Tipografia', 'Newsreader para títulos, Manrope para a interface e Geist Mono para metadados.'],
    spacing: ['Espaçamento', 'Uma escala de 4 px para organizar proximidade, ritmo e respiro.'],
    motion: ['Movimento', 'Entradas suaves, saídas rápidas e movimentos pequenos. Sempre respeitando movimento reduzido.'],
    icons: ['Ícones', 'Lucide é a família de ícones do sistema. Um traço consistente em todas as ações.'],
    button: ['Botão', 'Ações com hierarquia clara, tamanhos consistentes e estados visíveis.'],
    badge: ['Etiqueta', 'Categorias e informações curtas que acompanham o conteúdo.'],
    field: ['Campos', 'Rótulos, ajuda e erros para entradas de texto e seleção.'],
    toggle: ['Alternância', 'Uma escolha binária com resposta imediata.'],
    pagination: ['Paginação', 'Navegação entre páginas com indicação da posição atual.'],
    accordion: ['Acordeão', 'Conteúdo complementar que se abre quando necessário.'],
    alert: ['Alerta', 'Mensagens de sucesso e erro com contexto suficiente para agir.'],
    empty: ['Estado vazio', 'Uma explicação e um próximo passo quando ainda não há conteúdo.'],
    skeleton: ['Carregamento', 'Uma representação discreta da estrutura enquanto o conteúdo chega.'],
    dialog: ['Modal', 'Uma superfície de atenção temporária, com abertura e fechamento pelo centro.'],
    toast: ['Notificação', 'Uma confirmação breve, sem interromper o que está sendo feito.'],
    book: ['Livro', 'A capa, a lombada e o movimento 3D que identificam os artigos do blog.'],
    post: ['Artigo em livro', 'O livro acompanhado de categoria, descrição e informações de leitura.'],
    'post-grid': ['Estante de artigos', 'Uma coleção responsiva de livros. Clique em uma capa para experimentar a leitura.'],
    project: ['Projeto', 'Uma apresentação visual do trabalho, com contexto e acesso aos detalhes.'],
    author: ['Autor', 'Identidade e uma breve apresentação de quem escreve.'],
    quote: ['Citação', 'Uma pausa editorial para destacar uma ideia.'],
    artwork: ['Ilustração', 'O caderno visual que acompanha a identidade do blog.'],
    article: ['Página de leitura', 'Texto, autoria e imagem em uma composição pensada para a leitura.'],
  },
}
const en: typeof pt = {
  overview: 'Overview', introduction: 'The pieces that shape the blog. Explore individual components or see the complete system on this page.',
  foundations: 'Foundations', components: 'Components', editorial: 'Editorial', search: 'Find a component', noResults: 'No components found.', clear: 'Clear search', browse: 'Explore component', navigation: 'Navigate the design system',
  pauseMotion: 'Pause animation', notebook: 'Idea notebook', correspondence: 'Letters and discoveries',
  default: 'Default', variants: 'Variants', states: 'States', sizes: 'Sizes', interaction: 'Interaction', image: 'With image', simple: 'Simple cover', texture: 'Texture',
  entries: {
    colors: ['Colors', 'Paper, ink, and terracotta. Warm neutrals with one accent.'],
    typography: ['Typography', 'Newsreader for headings, Manrope for the interface, and Geist Mono for metadata.'],
    spacing: ['Spacing', 'A 4 px scale for proximity, rhythm, and breathing room.'],
    motion: ['Motion', 'Soft entrances, quick exits, and small movements. Always respecting reduced motion.'],
    icons: ['Icons', 'Lucide is the system icon family, with a consistent stroke across actions.'],
    button: ['Button', 'Actions with clear hierarchy, consistent sizes, and visible states.'],
    badge: ['Badge', 'Categories and short information alongside content.'],
    field: ['Fields', 'Labels, hints, and errors for text inputs and selection.'],
    toggle: ['Toggle', 'A binary choice with immediate feedback.'],
    pagination: ['Pagination', 'Page navigation with a clear current position.'],
    accordion: ['Accordion', 'Supporting content that opens when needed.'],
    alert: ['Alert', 'Success and error messages with enough context to act.'],
    empty: ['Empty state', 'An explanation and next step when there is no content yet.'],
    skeleton: ['Skeleton', 'A quiet representation of the structure while content loads.'],
    dialog: ['Modal', 'A temporary focus surface, opening and closing from its center.'],
    toast: ['Toast', 'A brief confirmation without interrupting the current task.'],
    book: ['Book', 'The cover, binding, and 3D motion that identify the blog articles.'],
    post: ['Book article', 'A book with category, description, and reading information.'],
    'post-grid': ['Article shelf', 'A responsive collection of books. Click a cover to try reading.'],
    project: ['Project', 'A visual introduction to the work, with context and access to details.'],
    author: ['Author', 'The identity and a short introduction of the writer.'],
    quote: ['Quote', 'An editorial pause to highlight an idea.'],
    artwork: ['Illustration', 'The visual notebook that accompanies the blog identity.'],
    article: ['Reading page', 'Text, authorship, and imagery arranged for reading.'],
  },
}
export const catalogCopy = (locale: Locale) => locale === 'pt' ? pt : en
export const catalogGroups = [catalogIds.slice(0, 5), catalogIds.slice(5, 16), catalogIds.slice(16)]
export function catalogRoute(hash: string): CatalogId | 'overview' {
  const id = hash.replace(/^#\/?(?:design-system\/)?/, '')
  if (id === 'books') return 'book'
  if (id === 'editorial') return 'post-grid'
  return catalogIds.includes(id as CatalogId) ? id as CatalogId : 'overview'
}
export const catalogHref = (id: string) => `#/design-system/${id}`
