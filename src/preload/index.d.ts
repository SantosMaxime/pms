import { ElectronAPI } from '@electron-toolkit/preload'

// Keep in sync with src/main/updater.ts
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date' }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }
  | { state: 'unsupported' }

export interface API {
  fs: {
    scanDirectory: (dirPath: string) => Promise<{
      success: boolean
      projects?: Array<{ name: string; path: string; lastModified: number }>
      error?: string
    }>
    readPackageJson: (projectPath: string) => Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }>
    checkFileExists: (filePath: string) => Promise<boolean>
    findWebStormInToolbox: (toolboxPath: string) => Promise<string | null>
    expandPath: (pathWithVars: string) => Promise<{
      success: boolean
      path?: string
      error?: string
    }>
  }
  dialog: {
    selectFolder: () => Promise<{
      success: boolean
      path?: string
      canceled?: boolean
    }>
  }
  editor: {
    launch: (
      editorPath: string,
      projectPath: string
    ) => Promise<{
      success: boolean
      error?: string
    }>
  }
  tray: {
    updateMenu: (
      recentProjects: Array<{ name: string; path: string; editor?: string }>
    ) => Promise<{
      success: boolean
    }>
  }
  updater: {
    getStatus: () => Promise<UpdateStatus>
    check: () => Promise<UpdateStatus>
    install: () => Promise<void>
    /** Subscribe to status changes; returns an unsubscribe function */
    onStatus: (callback: (status: UpdateStatus) => void) => () => void
  }
  app: {
    getVersion: () => Promise<string>
    setLaunchAtStartup: (enable: boolean) => Promise<{ success: boolean; error?: string }>
    getLaunchAtStartup: () => Promise<{ success: boolean; enabled: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
