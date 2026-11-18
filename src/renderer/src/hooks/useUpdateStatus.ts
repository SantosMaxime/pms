import { useEffect, useState } from 'react'
import type { UpdateStatus } from '../../../preload/index.d'

/** Live status of the background updater (see src/main/updater.ts). */
export function useUpdateStatus(): UpdateStatus {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })

  useEffect(() => {
    let active = true
    window.api.updater.getStatus().then((s) => active && setStatus(s))
    const unsubscribe = window.api.updater.onStatus(setStatus)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return status
}

export function describeUpdateStatus(status: UpdateStatus): string {
  switch (status.state) {
    case 'checking':
      return 'Checking for updates…'
    case 'up-to-date':
      return 'You have the latest version.'
    case 'downloading':
      return `Downloading v${status.version}… ${status.percent}%`
    case 'ready':
      return `v${status.version} is ready to install.`
    case 'error':
      return 'Could not check for updates. Try again later.'
    case 'unsupported':
      return 'Updates are only available in the installed app.'
    default:
      return ''
  }
}
