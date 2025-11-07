import type { EditorApp } from '../components/RecentProject'

export type EditorStatus = {
  app: EditorApp
  found: boolean
  path: string | null
}

/**
 * Detect the current platform
 */
function getPlatform(): 'windows' | 'mac' | 'linux' {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('win')) return 'windows'
  if (platform.includes('mac')) return 'mac'
  return 'linux'
}

/**
 * Detect installed editors by checking common installation paths
 * Returns status for each editor
 */
export async function detectEditors(): Promise<EditorStatus[]> {
  const results = await Promise.all([detectVSCode(), detectCursor(), detectWebStorm()])

  return results
}

async function detectVSCode(): Promise<EditorStatus> {
  const platform = getPlatform()
  let paths: string[] = []

  if (platform === 'windows') {
    const userProfile = await getUserProfilePath()
    const programFiles = await getProgramFilesPath()

    paths = [
      `${userProfile}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`,
      `${programFiles}\\Microsoft VS Code\\Code.exe`,
      `${programFiles.replace('Program Files', 'Program Files (x86)')}\\Microsoft VS Code\\Code.exe`
    ]
  } else if (platform === 'mac') {
    paths = [
      '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      `${await getHomeDir()}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`
    ]
  } else {
    // Linux
    paths = [
      '/usr/bin/code',
      '/usr/local/bin/code',
      '/snap/bin/code',
      `${await getHomeDir()}/.local/bin/code`
    ]
  }

  const foundPath = await checkPaths(paths)

  return {
    app: 'vscode',
    found: foundPath !== null,
    path: foundPath
  }
}

async function detectCursor(): Promise<EditorStatus> {
  const platform = getPlatform()
  let paths: string[] = []

  if (platform === 'windows') {
    const userProfile = await getUserProfilePath()
    paths = [`${userProfile}\\AppData\\Local\\Programs\\Cursor\\Cursor.exe`]
  } else if (platform === 'mac') {
    paths = [
      '/Applications/Cursor.app/Contents/MacOS/Cursor',
      `${await getHomeDir()}/Applications/Cursor.app/Contents/MacOS/Cursor`
    ]
  } else {
    // Linux
    paths = [
      '/usr/bin/cursor',
      '/usr/local/bin/cursor',
      `${await getHomeDir()}/.local/bin/cursor`
    ]
  }

  const foundPath = await checkPaths(paths)

  return {
    app: 'cursor',
    found: foundPath !== null,
    path: foundPath
  }
}

async function detectWebStorm(): Promise<EditorStatus> {
  const platform = getPlatform()
  let paths: string[] = []

  if (platform === 'windows') {
    const userProfile = await getUserProfilePath()
    const programFiles = await getProgramFilesPath()

    paths = [
      `${userProfile}\\AppData\\Local\\JetBrains\\Toolbox\\apps\\WebStorm`,
      `${programFiles}\\JetBrains\\WebStorm`,
      `${programFiles.replace('Program Files', 'Program Files (x86)')}\\JetBrains\\WebStorm`
    ]

    // WebStorm can be in versioned folders, so we need special handling
    const foundPath = await checkWebStormPaths(paths)

    return {
      app: 'webstorm',
      found: foundPath !== null,
      path: foundPath
    }
  } else if (platform === 'mac') {
    paths = [
      '/Applications/WebStorm.app/Contents/MacOS/webstorm',
      `${await getHomeDir()}/Applications/WebStorm.app/Contents/MacOS/webstorm`,
      `${await getHomeDir()}/Library/Application Support/JetBrains/Toolbox/apps/WebStorm`
    ]
  } else {
    // Linux
    paths = [
      '/usr/bin/webstorm',
      '/usr/local/bin/webstorm',
      `${await getHomeDir()}/.local/bin/webstorm`,
      `${await getHomeDir()}/.local/share/JetBrains/Toolbox/apps/WebStorm`
    ]
  }

  const foundPath = await checkPaths(paths)

  return {
    app: 'webstorm',
    found: foundPath !== null,
    path: foundPath
  }
}

/**
 * Get user profile path using IPC or fallback to common default (Windows)
 */
async function getUserProfilePath(): Promise<string> {
  const expanded = await expandEnvVars('%USERPROFILE%')
  // If expansion failed, use common default
  return expanded.includes('%')
    ? 'C:\\Users\\' + (navigator.userAgent.match(/\(.*?\)/)?.[0] || 'User')
    : expanded
}

/**
 * Get home directory path (macOS/Linux)
 */
async function getHomeDir(): Promise<string> {
  const platform = getPlatform()
  
  if (platform === 'windows') {
    return await getUserProfilePath()
  }
  
  // For macOS/Linux, try to expand $HOME
  const expanded = await expandEnvVars('$HOME')
  return expanded.includes('$') ? (platform === 'mac' ? '/Users' : '/home') : expanded
}

/**
 * Get Program Files path using IPC or fallback (Windows)
 */
async function getProgramFilesPath(): Promise<string> {
  const expanded = await expandEnvVars('%ProgramFiles%')
  return expanded.includes('%') ? 'C:\\Program Files' : expanded
}

/**
 * Check multiple paths and return the first one that exists
 */
async function checkPaths(paths: string[]): Promise<string | null> {
  for (const path of paths) {
    const expandedPath = await expandEnvVars(path)
    const exists = await window.api.fs.checkFileExists(expandedPath)
    if (exists) {
      return expandedPath
    }
  }
  return null
}

/**
 * Special handling for WebStorm which may be in versioned directories
 */
async function checkWebStormPaths(basePaths: string[]): Promise<string | null> {
  for (const basePath of basePaths) {
    const expandedPath = await expandEnvVars(basePath)

    // For Toolbox installations, check for versioned folders
    if (basePath.includes('Toolbox')) {
      const webstormPath = await window.api.fs.findWebStormInToolbox(expandedPath)
      if (webstormPath) {
        return webstormPath
      }
    } else {
      // For standalone installations, check bin folder
      const exePath = `${expandedPath}\\bin\\webstorm64.exe`
      const exists = await window.api.fs.checkFileExists(exePath)
      if (exists) {
        return exePath
      }
    }
  }
  return null
}

/**
 * Expand environment variables in path strings using IPC
 * Falls back to direct path if IPC is not available
 */
async function expandEnvVars(path: string): Promise<string> {
  try {
    // Check if the IPC method exists
    if (window.api?.fs?.expandPath) {
      const result = await window.api.fs.expandPath(path)
      if (result.success && result.path) {
        return result.path
      }
    }

    // Fallback: return path as-is (it will be checked for existence anyway)
    console.warn('expandPath IPC not available, using path as-is:', path)
    return path
  } catch (error) {
    console.error('Error expanding path:', error)
    return path
  }
}

/**
 * Launch a project with the specified editor
 */
export async function launchProject(
  projectPath: string,
  editor: EditorApp,
  customPath?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use custom path if provided, otherwise detect
    let editorPath = customPath

    if (!editorPath) {
      const detected = await detectEditors()
      const editorStatus = detected.find((e) => e.app === editor)

      if (!editorStatus?.found || !editorStatus.path) {
        return {
          success: false,
          error: `${editor} is not installed or could not be found`
        }
      }

      editorPath = editorStatus.path
    }

    // Launch the editor with the project path
    const result = await window.api.editor.launch(editorPath, projectPath)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
