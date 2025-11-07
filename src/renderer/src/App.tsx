import { useState, useEffect } from 'react'
import Versions from './components/Versions'
import SearchBar from './components/SearchBar'
import RecentProject, { type EditorApp } from './components/RecentProject'
import Settings from './components/Settings'
import ProjectSettings from './components/ProjectSettings'
import { loadSettings } from './stores/settingsStore'
import { scanAllPaths } from './services/projectScanner'
import { launchProject } from './services/editorDetector'
import type { ProjectInfo } from './types/project'

function App(): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [allProjects, setAllProjects] = useState<ProjectInfo[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(loadSettings())
  const [isScanning, setIsScanning] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null)
  const [projectDefaults, setProjectDefaults] = useState<Record<string, EditorApp>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showVersions, setShowVersions] = useState(true)
  const [versionsHiding, setVersionsHiding] = useState(false)
  const projectsPerPage = 6

  function getProjectDefaultApp(projectId: string): EditorApp {
    return projectDefaults[projectId] || 'vscode'
  }

  function handleSaveProjectSettings(projectId: string, app: EditorApp): void {
    setProjectDefaults((prev) => ({ ...prev, [projectId]: app }))
  }

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / projectsPerPage)
  const startIndex = (currentPage - 1) * projectsPerPage
  const endIndex = startIndex + projectsPerPage
  const currentProjects = projects.slice(startIndex, endIndex)

  function handlePageChange(page: number): void {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function scanProjects(): Promise<void> {
    setIsScanning(true)
    const enabledPaths = settings.searchPaths.filter((p) => p.enabled).map((p) => p.path)
    const found = await scanAllPaths(enabledPaths)

    // Store all projects for search
    setAllProjects(found)

    // Filter to show only recent projects (last 3 weeks) initially
    const threeWeeksAgo = new Date()
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
    const recent = found
      .filter((p) => p.lastModified >= threeWeeksAgo)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()) // Most recent first
    setProjects(recent)

    setIsScanning(false)
  }

  function handleSearch(query: string): void {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching

    if (!query.trim()) {
      // If search is empty, show recent projects only
      const threeWeeksAgo = new Date()
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
      const recent = allProjects
        .filter((p) => p.lastModified >= threeWeeksAgo)
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()) // Most recent first
      setProjects(recent)
    } else {
      // Search in all projects (not just recent)
      const searchLower = query.toLowerCase()
      const filtered = allProjects.filter((project) => {
        return (
          project.name.toLowerCase().includes(searchLower) ||
          project.path.toLowerCase().includes(searchLower) ||
          project.frameworks?.some((f) => f.toLowerCase().includes(searchLower))
        )
      })
      setProjects(filtered)
    }
  }

  function handleSettingsUpdate(): void {
    setSettings(loadSettings())
  }

  useEffect(() => {
    scanProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  // Hide versions after 5 seconds
  useEffect(() => {
    // Start hide animation after 4 seconds
    const hideTimer = setTimeout(() => {
      setVersionsHiding(true)
    }, 4000)

    // Actually remove component after animation completes (5 seconds total)
    const removeTimer = setTimeout(() => {
      setShowVersions(false)
    }, 5000)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  // Update tray menu with recent projects
  useEffect(() => {
    const updateTrayMenu = async (): Promise<void> => {
      const recentProjects = projects.slice(0, 4).map((project) => {
        const defaultApp = getProjectDefaultApp(project.id)
        const editorPath = project.availableEditors?.[defaultApp]
        return {
          name: project.name,
          path: project.path,
          editor: editorPath
        }
      })
      await window.api.tray.updateMenu(recentProjects)
    }
    updateTrayMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectDefaults])

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '80px 0 80px 0'
      }}
    >
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 50 }}>
        <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowSettings(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Settings searchPaths={settings.searchPaths} onUpdate={handleSettingsUpdate} />
          </div>
        </div>
      )}

      <SearchBar
        placeholder="Search projects by name, path, or framework..."
        onSearch={handleSearch}
      />
      <div style={{ width: 'min(1060px, 92%)' }}>
        {settings.searchPaths.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: 16,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14
            }}
          >
            {isScanning ? (
              'Scanning...'
            ) : searchQuery ? (
              <>
                {projects.length} project{projects.length !== 1 ? 's' : ''} found
              </>
            ) : (
              <>
                {projects.length} project{projects.length !== 1 ? 's' : ''} modified in the last 3
                weeks
              </>
            )}
          </div>
        )}

        {/* Empty state when no search paths configured */}
        {settings.searchPaths.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 40px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              maxWidth: '600px',
              margin: '40px auto',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>📁</div>
            <h2
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px'
              }}
            >
              No Search Paths Configured
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '24px',
                maxWidth: '480px'
              }}
            >
              To get started, you need to add at least one search path where your projects are
              located. Click the Settings button in the top-right corner and add directories like{' '}
              <code
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                C:\Users\Your Name\Documents\GitHub
              </code>
            </p>
            <button
              style={{
                padding: '12px 24px',
                background: 'rgba(103, 136, 230, 0.2)',
                border: '1px solid rgba(103, 136, 230, 0.4)',
                borderRadius: '10px',
                color: 'rgba(103, 136, 230, 1)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setShowSettings(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(103, 136, 230, 0.3)'
                e.currentTarget.style.borderColor = 'rgba(103, 136, 230, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(103, 136, 230, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(103, 136, 230, 0.4)'
              }}
            >
              ⚙️ Open Settings
            </button>
          </div>
        ) : (
          <div className="recent-list">
            {currentProjects.map((project) => (
              <RecentProject
                key={project.id}
                name={project.name}
                path={project.path}
                frameworks={project.frameworks}
                size="medium"
                defaultApp={getProjectDefaultApp(project.id)}
                onOpen={async (app: EditorApp) => {
                  const customPath = settings.editorPaths?.[app]
                  const result = await launchProject(project.path, app, customPath)
                  if (!result.success) {
                    console.error('Failed to launch project:', result.error)
                    alert(`Failed to launch ${app}: ${result.error}`)
                  }
                }}
                onSettings={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {selectedProject && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setSelectedProject(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ProjectSettings
                projectName={selectedProject.name}
                defaultApp={getProjectDefaultApp(selectedProject.id)}
                onSave={(app) => handleSaveProjectSettings(selectedProject.id, app)}
                onClose={() => setSelectedProject(null)}
              />
            </div>
          </div>
        )}
      </div>

      {showVersions && <Versions className={versionsHiding ? 'hide' : ''} />}
    </div>
  )
}

export default App
