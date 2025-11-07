import { ElectronAPI } from '@electron-toolkit/preload'

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
  app: {
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
