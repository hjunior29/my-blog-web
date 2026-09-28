import { useParams } from '@solidjs/router'
import { useI18n } from '../../i18n'

export function StudioEditorPage() {
  const { t } = useI18n()
  const params = useParams()

  return (
    <div class="studio-editor-page">
      <h1 class="serif">{params.id ? t().editorEditTitle : t().editorNewTitle}</h1>
    </div>
  )
}
