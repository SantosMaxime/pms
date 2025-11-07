import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/pms_512x_icon.png?asset'
import { readdirSync, statSync, existsSync, readFileSync } from 'fs'
import { spawn } from 'child_process'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Function to create system tray
function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  
  // Resize icon based on platform
  const iconSize = process.platform === 'darwin' ? { width: 22, height: 22 } : { width: 16, height: 16 }
  tray = new Tray(trayIcon.resize(iconSize))
  
  // On macOS, set template mode for better appearance in dark/light mode
  if (process.platform === 'darwin') {
    tray.setImage(trayIcon.resize(iconSize))
  }
  
  tray.setToolTip('Project Management System')

  // Set initial context menu
  updateTrayMenu([])

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

// Function to update tray menu with recent projects
function updateTrayMenu(
  recentProjects: Array<{ name: string; path: string; editor?: string }>
): void {
  if (!tray) return

  const menuItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Open App',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' }
  ]

  // Add recent projects
  if (recentProjects.length > 0) {
    menuItems.push({
      label: 'Recent Projects',
      enabled: false
    })

    recentProjects.slice(0, 4).forEach((project) => {
      menuItems.push({
        label: project.name,
        click: async () => {
          if (project.editor && existsSync(project.editor) && existsSync(project.path)) {
            spawn(project.editor, [project.path], {
              detached: true,
              stdio: 'ignore'
            }).unref()
          }
        }
      })
    })

    menuItems.push({ type: 'separator' })
  }

  menuItems.push({
    label: 'Quit',
    click: () => {
      isQuitting = true
      app.quit()
    }
  })

  const contextMenu = Menu.buildFromTemplate(menuItems)
  tray.setContextMenu(contextMenu)
}

// IPC handler to update tray menu from renderer
ipcMain.handle('tray:updateMenu', async (_, recentProjects) => {
  updateTrayMenu(recentProjects)
  return { success: true }
})

// IPC handlers for launch at startup
ipcMain.handle('app:setLaunchAtStartup', async (_, enable: boolean) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('app:getLaunchAtStartup', async () => {
  try {
    const settings = app.getLoginItemSettings()
    return { success: true, enabled: settings.openAtLogin }
  } catch (error) {
    return { success: false, error: String(error), enabled: false }
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers for filesystem operations
  ipcMain.handle('fs:scanDirectory', async (_, dirPath: string) => {
    try {
      if (!existsSync(dirPath)) {
        return { success: false, error: 'Path does not exist' }
      }

      const entries = readdirSync(dirPath, { withFileTypes: true })
      const projects: Array<{ name: string; path: string; lastModified: number }> = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join(dirPath, entry.name)
          try {
            const stats = statSync(fullPath)
            projects.push({
              name: entry.name,
              path: fullPath,
              lastModified: stats.mtimeMs
            })
          } catch {
            // Skip directories we can't access
            continue
          }
        }
      }

      return { success: true, projects }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // IPC handler for folder selection dialog
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    return { success: true, path: result.filePaths[0] }
  })

  // IPC handler for reading package.json
  ipcMain.handle('fs:readPackageJson', async (_, projectPath: string) => {
    try {
      const packageJsonPath = join(projectPath, 'package.json')
      if (!existsSync(packageJsonPath)) {
        return { success: false, error: 'package.json not found' }
      }

      const content = readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      return { success: true, data: packageJson }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // IPC handler to check if a file exists
  ipcMain.handle('fs:checkFileExists', async (_, filePath: string) => {
    try {
      return existsSync(filePath)
    } catch {
      return false
    }
  })

  // IPC handler to find WebStorm in JetBrains Toolbox
  ipcMain.handle('fs:findWebStormInToolbox', async (_, toolboxPath: string) => {
    try {
      if (!existsSync(toolboxPath)) {
        return null
      }

      const entries = readdirSync(toolboxPath, { withFileTypes: true })

      // Look for versioned WebStorm folders (e.g., "ch-0/243.21565.193")
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const versionPath = join(toolboxPath, entry.name)
          const binPath = join(versionPath, 'bin', 'webstorm64.exe')

          if (existsSync(binPath)) {
            return binPath
          }

          // Check nested folders
          try {
            const nestedEntries = readdirSync(versionPath, { withFileTypes: true })
            for (const nested of nestedEntries) {
              if (nested.isDirectory()) {
                const nestedBinPath = join(versionPath, nested.name, 'bin', 'webstorm64.exe')
                if (existsSync(nestedBinPath)) {
                  return nestedBinPath
                }
              }
            }
          } catch {
            continue
          }
        }
      }

      return null
    } catch {
      return null
    }
  })

  // IPC handler to expand environment variables in paths
  ipcMain.handle('fs:expandPath', async (_, pathWithVars: string) => {
    try {
      // Replace %VAR% with actual environment variable values
      const expanded = pathWithVars.replace(/%([^%]+)%/g, (_, varName) => {
        return process.env[varName] || `%${varName}%`
      })
      return { success: true, path: expanded }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // IPC handler to launch an editor with a project
  ipcMain.handle('editor:launch', async (_, editorPath: string, projectPath: string) => {
    try {
      if (!existsSync(editorPath)) {
        return { success: false, error: 'Editor executable not found' }
      }

      if (!existsSync(projectPath)) {
        return { success: false, error: 'Project path not found' }
      }

      // Launch the editor with the project path as argument
      spawn(editorPath, [projectPath], {
        detached: true,
        stdio: 'ignore'
      }).unref()

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  createWindow()

  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Don't quit the app, keep it running in the tray
  // User must explicitly click "Quit" from tray menu
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
