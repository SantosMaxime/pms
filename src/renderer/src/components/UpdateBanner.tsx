import { useState } from 'react'
import { useUpdateStatus } from '../hooks/useUpdateStatus'

/** Floating notice shown once a downloaded update is ready to install. */
function UpdateBanner(): React.JSX.Element | null {
  const status = useUpdateStatus()
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null)

  if (status.state !== 'ready' || dismissedVersion === status.version) return null

  return (
    <div className="update-banner" role="status">
      <span className="update-banner-dot" />
      <span>
        <b>PMS v{status.version}</b> is ready to install
      </span>
      <button className="settings-btn" onClick={() => window.api.updater.install()}>
        Restart now
      </button>
      <button
        className="settings-btn secondary"
        onClick={() => setDismissedVersion(status.version)}
      >
        Later
      </button>
    </div>
  )
}

export default UpdateBanner
