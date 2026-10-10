import { Button } from './primitives'
import { Icon } from './Icon'
import './reading-resume-banner.css'

export interface ReadingResumeBannerProps {
  readonly progress: number
  readonly onResume: () => void
  readonly onDismiss: () => void
  readonly label?: string
  readonly resumeActionLabel?: string
  readonly dismissLabel?: string
}

export function ReadingResumeBanner(props: ReadingResumeBannerProps) {
  const percent = Math.round(props.progress * 100)
  const text = () => props.label ?? `Resume reading from ${percent}%`
  const resumeText = () => props.resumeActionLabel ?? 'Resume'
  const dismissText = () => props.dismissLabel ?? 'Dismiss'

  return (
    <div class="ds-reading-resume-banner" role="status" aria-live="polite">
      <div class="ds-reading-resume-content">
        <span class="ds-reading-resume-icon" aria-hidden="true">
          <Icon name="bookmark" size={16} />
        </span>
        <span class="ds-reading-resume-text">{text()}</span>
      </div>
      <div class="ds-reading-resume-actions">
        <Button variant="secondary" size="small" onClick={props.onResume}>
          {resumeText()}
        </Button>
        <button
          type="button"
          class="ds-reading-resume-dismiss"
          onClick={props.onDismiss}
          aria-label={dismissText()}
          title={dismissText()}
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  )
}
