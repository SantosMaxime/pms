export type ProjectInfo = {
  id: string
  name: string
  path: string
  lastModified: Date
  frameworks?: string[]
  availableEditors?: Record<string, string>
}

export type SearchPath = {
  id: string
  path: string
  enabled: boolean
}

export type EditorPaths = {
  vscode?: string
  cursor?: string
  webstorm?: string
}

export type Settings = {
  searchPaths: SearchPath[]
  editorPaths?: EditorPaths
}
