import { useState, useEffect } from 'react'
import type { SearchPath, EditorPaths } from '../types/project'
import {
  addSearchPath,
  removeSearchPath,
  toggleSearchPath,
  loadSettings,
  saveSettings
} from '../stores/settingsStore'
import { detectEditors, type EditorStatus } from '../services/editorDetector'

type Props = {
  searchPaths: SearchPath[]
  onUpdate: () => void
}

function Settings({ searchPaths, onUpdate }: Props): React.JSX.Element {
  const [newPath, setNewPath] = useState('')
  const [editors, setEditors] = useState<EditorStatus[]>([])
  const [customPaths, setCustomPaths] = useState<EditorPaths>({})
  const [showEditorSection, setShowEditorSection] = useState(false)
  const [launchAtStartup, setLaunchAtStartup] = useState(false)

  useEffect(() => {
    detectEditors().then(setEditors)
    const settings = loadSettings()
    if (settings.editorPaths) {
      setCustomPaths(settings.editorPaths)
    }
    // Get launch at startup status
    window.api.app.getLaunchAtStartup().then((result) => {
      if (result.success) {
        setLaunchAtStartup(result.enabled)
      }
    })
  }, [])

  async function handleBrowse(): Promise<void> {
    const result = await window.api.dialog.selectFolder()
    if (result.success && result.path) {
      setNewPath(result.path)
    }
  }

  function handleAdd(): void {
    if (newPath.trim()) {
      addSearchPath(newPath.trim())
      setNewPath('')
      onUpdate()
    }
  }

  function handleRemove(id: string): void {
    removeSearchPath(id)
    onUpdate()
  }

  function handleToggle(id: string): void {
    toggleSearchPath(id)
    onUpdate()
  }

  function handleCustomPathChange(editor: string, path: string): void {
    const newCustomPaths = { ...customPaths, [editor]: path }
    setCustomPaths(newCustomPaths)
    const settings = loadSettings()
    settings.editorPaths = newCustomPaths
    saveSettings(settings)
  }

  function getEditorDisplayName(app: string): string {
    const names = { vscode: 'VS Code', cursor: 'Cursor', webstorm: 'WebStorm' }
    return names[app] || app
  }

  async function handleLaunchAtStartupToggle(): Promise<void> {
    const newValue = !launchAtStartup
    const result = await window.api.app.setLaunchAtStartup(newValue)
    if (result.success) {
      setLaunchAtStartup(newValue)
    }
  }

  return (
    <div className="settings-panel" style={{ minWidth: '540px', maxWidth: '680px' }}>
      <h2 className="settings-title">Settings</h2>

      {/* Launch at Startup */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <label
          className="settings-label"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <input
            type="checkbox"
            checked={launchAtStartup}
            onChange={handleLaunchAtStartupToggle}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <div>
            <div
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              Launch at Startup
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                textTransform: 'none',
                letterSpacing: 'normal'
              }}
            >
              Automatically start the app when you log in to Windows
            </div>
          </div>
        </label>
      </div>

      <h3 className="settings-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
        Search Paths
      </h3>
      <div className="settings-add">
        <input
          className="settings-input"
          type="text"
          placeholder="C:\Projects"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="settings-btn secondary icon"
          onClick={handleBrowse}
          aria-label="Browse folder"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="settings-btn" onClick={handleAdd}>
          Add Path
        </button>
      </div>

      <ul className="settings-list">
        {searchPaths.map((sp) => (
          <li key={sp.id} className="settings-item">
            <label className="settings-label">
              <input type="checkbox" checked={sp.enabled} onChange={() => handleToggle(sp.id)} />
              <span className="settings-path">{sp.path}</span>
            </label>
            <button className="settings-remove" onClick={() => handleRemove(sp.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h2 className="settings-title" style={{ margin: 0 }}>
            Editor Paths
          </h2>
          <button
            className="settings-btn secondary"
            onClick={() => setShowEditorSection(!showEditorSection)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {showEditorSection ? 'Hide' : 'Show'}
          </button>
        </div>

        {showEditorSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {editors.map((editor) => (
              <div
                key={editor.app}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                >
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    {getEditorDisplayName(editor.app)}
                  </span>
                  {editor.found ? (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(104,160,99,0.2)',
                        color: 'rgb(104,160,99)',
                        borderRadius: '4px'
                      }}
                    >
                      ✓ Detected
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(255,120,120,0.2)',
                        color: 'rgb(255,120,120)',
                        borderRadius: '4px'
                      }}
                    >
                      Not found
                    </span>
                  )}
                </div>
                {editor.found && editor.path && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '8px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {editor.path}
                  </div>
                )}
                <input
                  className="settings-input"
                  type="text"
                  placeholder={
                    editor.found ? 'Custom path (optional)' : 'Enter path to editor executable'
                  }
                  value={customPaths[editor.app] || ''}
                  onChange={(e) => handleCustomPathChange(editor.app, e.target.value)}
                  style={{ fontSize: '13px' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
