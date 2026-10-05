import { Button, Dialog } from '../../design-system'
import { useI18n } from '../../i18n'

export interface ConflictDialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onResolveLocal: () => void
  readonly onResolveRemote: () => void
}

export function ConflictDialog(props: ConflictDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog
      open={props.open}
      title={t().conflictTitle}
      badge="Conflict"
      closeLabel={t().cancelAction}
      hideFooterClose={true}
      onClose={props.onClose}
    >
      <div class="conflict-dialog-body">
        <p class="conflict-dialog-text">{t().conflictMessage}</p>
        <div class="conflict-actions-row">
          <Button variant="secondary" onClick={props.onResolveLocal}>
            {t().conflictResolveLocal}
          </Button>
          <Button variant="primary" onClick={props.onResolveRemote}>
            {t().conflictResolveRemote}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
