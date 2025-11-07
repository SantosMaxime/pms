import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  fs: {
    scanDirectory: (
      dirPath: string
    ): Promise<{
      success: boolean
      projects?: Array<{ name: string; path: string; lastModified: number }>
      error?: string
    }> => ipcRenderer.invoke('fs:scanDirectory', dirPath),
    readPackageJson: (
      projectPath: string
    ): Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }> => ipcRenderer.invoke('fs:readPackageJson', projectPath),
    checkFileExists: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke('fs:checkFileExists', filePath),
    findWebStormInToolbox: (toolboxPath: string): Promise<string | null> =>
      ipcRenderer.invoke('fs:findWebStormInToolbox', toolboxPath),
    expandPath: (
      pathWithVars: string
    ): Promise<{
      success: boolean
      path?: string
      error?: string
    }> => ipcRenderer.invoke('fs:expandPath', pathWithVars)
  },
  dialog: {
    selectFolder: (): Promise<{
      success: boolean
      path?: string
      canceled?: boolean
    }> => ipcRenderer.invoke('dialog:selectFolder')
  },
  editor: {
    launch: (
      editorPath: string,
      projectPath: string
    ): Promise<{
      success: boolean
      error?: string
    }> => ipcRenderer.invoke('editor:launch', editorPath, projectPath)
  },
  tray: {
    updateMenu: (
      recentProjects: Array<{ name: string; path: string; editor?: string }>
    ): Promise<{
      success: boolean
    }> => ipcRenderer.invoke('tray:updateMenu', recentProjects)
  },
  app: {
    setLaunchAtStartup: (enable: boolean): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('app:setLaunchAtStartup', enable),
    getLaunchAtStartup: (): Promise<{ success: boolean; enabled: boolean; error?: string }> =>
      ipcRenderer.invoke('app:getLaunchAtStartup')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
