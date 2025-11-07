import type { ProjectInfo } from '../types/project'
import { detectFrameworks } from '../utils/frameworkDetector'
import { detectEditors } from './editorDetector'

export async function scanProjectsInPath(dirPath: string): Promise<ProjectInfo[]> {
  try {
    const result = await window.api.fs.scanDirectory(dirPath)

    if (!result.success || !result.projects) {
      console.error(`Failed to scan ${dirPath}:`, result.error)
      return []
    }

    // Detect available editors once for all projects
    const editorStatuses = await detectEditors()
    const availableEditors: Record<string, string> = {}
    editorStatuses.forEach((status) => {
      if (status.found && status.path) {
        availableEditors[status.app] = status.path
      }
    })

    // Return ALL projects - let the App component filter by date if needed
    // Detect frameworks for each project
    const projectsWithFrameworks = await Promise.all(
      result.projects.map(async (p) => {
        const frameworks = await detectFrameworks(p.path)
        return {
          id: crypto.randomUUID(),
          name: p.name,
          path: p.path,
          lastModified: new Date(p.lastModified),
          frameworks,
          availableEditors
        }
      })
    )

    return projectsWithFrameworks
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error)
    return []
  }
}

export async function scanAllPaths(paths: string[]): Promise<ProjectInfo[]> {
  const results = await Promise.all(paths.map((p) => scanProjectsInPath(p)))
  return results.flat()
}
