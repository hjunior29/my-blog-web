import { Button, Dialog } from '../../design-system'
import { useI18n } from '../../i18n'

export interface DiscardDraftDialogProps {
  readonly open: boolean
  readonly busy?: boolean
  readonly onClose: () => void
  readonly onConfirm: () => void
}

export function DiscardDraftDialog(props: DiscardDraftDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog
      open={props.open}
      title={t().discardDraftDialogTitle}
      badge="Danger"
      closeLabel={t().cancelAction}
      hideFooterClose={true}
      onClose={props.onClose}
    >
      <div class="delete-dialog-content">
        <p class="delete-warning-text">{t().discardDraftDialogMessage}</p>
        <div class="delete-dialog-actions">
          <Button variant="secondary" onClick={props.onClose} disabled={props.busy}>
            {t().cancelAction}
          </Button>
          <Button variant="primary" onClick={props.onConfirm} busy={props.busy}>
            {t().discardDraftConfirmButton}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
