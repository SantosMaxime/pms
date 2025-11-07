import type { Settings, SearchPath } from '../types/project'

const STORAGE_KEY = 'pms-settings'

const defaultSettings: Settings = {
  searchPaths: [],
  editorPaths: {}
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Ensure editorPaths exists
      return {
        ...parsed,
        editorPaths: parsed.editorPaths || {}
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return defaultSettings
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function addSearchPath(path: string): Settings {
  const settings = loadSettings()
  const newPath: SearchPath = {
    id: crypto.randomUUID(),
    path,
    enabled: true
  }
  settings.searchPaths.push(newPath)
  saveSettings(settings)
  return settings
}

export function removeSearchPath(id: string): Settings {
  const settings = loadSettings()
  settings.searchPaths = settings.searchPaths.filter((p) => p.id !== id)
  saveSettings(settings)
  return settings
}

export function toggleSearchPath(id: string): Settings {
  const settings = loadSettings()
  const path = settings.searchPaths.find((p) => p.id === id)
  if (path) {
    path.enabled = !path.enabled
    saveSettings(settings)
  }
  return settings
}
