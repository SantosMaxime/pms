import { app, ipcMain, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date' }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }
  | { state: 'unsupported' }

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

let status: UpdateStatus = { state: 'idle' }
let pendingVersion = ''

/**
 * Checks GitHub Releases for a newer version, downloads it in the background
 * and lets the user restart into it. Updates are only possible in the
 * installed app, not in `npm run dev`.
 */
export function setupUpdater(options: {
  getWindow: () => BrowserWindow | null
  onStatusChange: (status: UpdateStatus) => void
  beforeInstall: () => void
}): void {
  function setStatus(next: UpdateStatus): void {
    status = next
    options.getWindow()?.webContents.send('updater:status', status)
    options.onStatusChange(status)
  }

  function check(): void {
    if (!app.isPackaged) {
      setStatus({ state: 'unsupported' })
      return
    }
    autoUpdater.checkForUpdates().catch((error) => {
      setStatus({ state: 'error', message: String(error?.message ?? error) })
    })
  }

  ipcMain.handle('updater:getStatus', () => status)
  ipcMain.handle('updater:check', () => {
    if (status.state !== 'downloading' && status.state !== 'ready') check()
    return status
  })
  ipcMain.handle('updater:install', () => installUpdate(options.beforeInstall))

  if (!app.isPackaged) {
    status = { state: 'unsupported' }
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => setStatus({ state: 'checking' }))
  autoUpdater.on('update-not-available', () => setStatus({ state: 'up-to-date' }))
  autoUpdater.on('update-available', (info) => {
    pendingVersion = info.version
    setStatus({ state: 'downloading', version: info.version, percent: 0 })
  })
  autoUpdater.on('download-progress', (progress) =>
    setStatus({
      state: 'downloading',
      version: pendingVersion,
      percent: Math.round(progress.percent)
    })
  )
  autoUpdater.on('update-downloaded', (info) =>
    setStatus({ state: 'ready', version: info.version })
  )
  autoUpdater.on('error', (error) => setStatus({ state: 'error', message: error.message }))

  check()
  setInterval(check, CHECK_INTERVAL_MS)
}

export function getUpdateStatus(): UpdateStatus {
  return status
}

export function checkForUpdates(): void {
  if (app.isPackaged && status.state !== 'downloading' && status.state !== 'ready') {
    autoUpdater.checkForUpdates().catch(() => {
      // reported through the 'error' event
    })
  }
}

export function installUpdate(beforeInstall: () => void): void {
  if (status.state !== 'ready') return
  beforeInstall()
  // Silent install, then relaunch the app.
  autoUpdater.quitAndInstall(true, true)
}
