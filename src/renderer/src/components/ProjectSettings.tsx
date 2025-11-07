import type { EditorApp } from './RecentProject'

type Props = {
  projectName: string
  defaultApp: EditorApp
  onSave: (app: EditorApp) => void
  onClose: () => void
}

function ProjectSettings({ projectName, defaultApp, onSave, onClose }: Props): React.JSX.Element {
  function handleAppSelect(app: EditorApp): void {
    onSave(app)
    onClose()
  }

  return (
    <div className="project-settings-panel">
      <div className="project-settings-header">
        <h3 className="project-settings-title">Project Settings</h3>
        <button className="project-settings-close" onClick={onClose} aria-label="Close">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="project-settings-name">{projectName}</div>

      <div className="project-settings-section">
        <label className="project-settings-label">Default Editor</label>
        <div className="project-settings-apps">
          <button
            className={`project-settings-app ${defaultApp === 'vscode' ? 'active' : ''}`}
            onClick={() => handleAppSelect('vscode')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5 0L6.5 1.5L2 5.5V18.5L6.5 22.5L17.5 24L22 20.5V3.5L17.5 0Z"
                fill="currentColor"
                opacity="0.3"
              />
              <path
                d="M17.5 0V24M6.5 4.5L14 12L6.5 19.5M2 8V16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>VS Code</span>
          </button>

          <button
            className={`project-settings-app ${defaultApp === 'cursor' ? 'active' : ''}`}
            onClick={() => handleAppSelect('cursor')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L20 20M4 20L20 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Cursor</span>
          </button>

          <button
            className={`project-settings-app ${defaultApp === 'webstorm' ? 'active' : ''}`}
            onClick={() => handleAppSelect('webstorm')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M6 8H10M6 11H14M6 14H9M14 14H18M15 8L18 11L15 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>WebStorm</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectSettings
