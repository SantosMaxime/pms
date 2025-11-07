import { useState, useEffect, useRef } from 'react'
import { FrameworkIcon } from './FrameworkIcon'

export type EditorApp = 'vscode' | 'cursor' | 'webstorm'

type Props = {
  name: string
  path?: string
  frameworks?: string[]
  defaultApp?: EditorApp
  onOpen?: (app: EditorApp) => void
  onSettings?: () => void
  /** size controls padding and font-sizing: 'small' | 'medium' | 'large' */
  size?: 'small' | 'medium' | 'large'
  style?: React.CSSProperties
  className?: string
}

function RecentProject({
  name,
  path,
  frameworks = [],
  defaultApp = 'vscode',
  onOpen,
  onSettings,
  size = 'medium',
  style,
  className
}: Props): React.JSX.Element {
  const [showAppMenu, setShowAppMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cls = `recent-project ${size} ${className ?? ''}`.trim()

  // Close menu when clicking outside
  useEffect(() => {
    if (!showAppMenu) return

    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAppMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAppMenu])

  // Extract only the immediate parent folder with "/"
  const getFolderDisplay = (fullPath: string): string => {
    const parts = fullPath.split(/[\\/]/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}/`
    }
    return parts[parts.length - 1] || fullPath
  }

  const folderDisplay = path ? getFolderDisplay(path) : undefined

  function handleMainClick(): void {
    onOpen?.(defaultApp)
  }

  function handleOpenWith(app: EditorApp): void {
    onOpen?.(app)
    setShowAppMenu(false)
  }

  return (
    <article
      className={cls}
      style={style}
      role="group"
      aria-label={`Recent project ${name}`}
      onClick={handleMainClick}
    >
      <div className="recent-left">
        <div className="recent-title">{name}</div>
        {folderDisplay && (
          <div className="recent-path" title={path}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="recent-path-icon"
            >
              <path
                d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{folderDisplay}</span>
          </div>
        )}
      </div>

      <div className="recent-right">
        {frameworks.length > 0 && (
          <div className="recent-frameworks">
            {frameworks.map((framework) => (
              <span
                key={framework}
                className="framework-badge"
                data-framework={framework.toLowerCase()}
              >
                <FrameworkIcon framework={framework} />
                <span>{framework}</span>
              </span>
            ))}
          </div>
        )}

        <div className="recent-actions">
          <button
            className="recent-icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              onSettings?.()
            }}
            aria-label="Project settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.7273 14.7273C18.6063 15.0015 18.5702 15.3056 18.6236 15.6005C18.6771 15.8954 18.8177 16.1676 19.0273 16.3818L19.0818 16.4364C19.2509 16.6052 19.385 16.8057 19.4765 17.0265C19.568 17.2472 19.6151 17.4838 19.6151 17.7227C19.6151 17.9617 19.568 18.1983 19.4765 18.419C19.385 18.6397 19.2509 18.8402 19.0818 19.0091C18.913 19.1781 18.7124 19.3122 18.4917 19.4037C18.271 19.4952 18.0344 19.5423 17.7955 19.5423C17.5565 19.5423 17.3199 19.4952 17.0992 19.4037C16.8785 19.3122 16.678 19.1781 16.5091 19.0091L16.4545 18.9545C16.2403 18.745 15.9681 18.6044 15.6733 18.5509C15.3784 18.4974 15.0742 18.5335 14.8 18.6545C14.5311 18.7698 14.3018 18.9611 14.1403 19.205C13.9788 19.4489 13.8921 19.7347 13.8909 20.0273V20.1818C13.8909 20.664 13.6993 21.1265 13.3584 21.4675C13.0175 21.8084 12.555 22 12.0727 22C11.5905 22 11.1281 21.8084 10.7871 21.4675C10.4462 21.1265 10.2545 20.664 10.2545 20.1818V20.1C10.2475 19.7991 10.1501 19.5073 9.97501 19.2625C9.79991 19.0176 9.55521 18.8312 9.27273 18.7273C8.99853 18.6063 8.69437 18.5702 8.39944 18.6236C8.10451 18.6771 7.83235 18.8177 7.61818 19.0273L7.56364 19.0818C7.39478 19.2509 7.19425 19.385 6.97353 19.4765C6.7528 19.568 6.51621 19.6151 6.27727 19.6151C6.03834 19.6151 5.80174 19.568 5.58102 19.4765C5.36029 19.385 5.15977 19.2509 4.99091 19.0818C4.82186 18.913 4.68775 18.7124 4.59626 18.4917C4.50476 18.271 4.45766 18.0344 4.45766 17.7955C4.45766 17.5565 4.50476 17.3199 4.59626 17.0992C4.68775 16.8785 4.82186 16.678 4.99091 16.5091L5.04545 16.4545C5.25503 16.2403 5.39562 15.9681 5.4491 15.6733C5.50257 15.3784 5.46647 15.0742 5.34545 14.8C5.23022 14.5311 5.03887 14.3018 4.79497 14.1403C4.55107 13.9788 4.26526 13.8921 3.97273 13.8909H3.81818C3.33597 13.8909 2.87351 13.6993 2.53253 13.3584C2.19156 13.0175 2 12.555 2 12.0727C2 11.5905 2.19156 11.1281 2.53253 10.7871C2.87351 10.4462 3.33597 10.2545 3.81818 10.2545H3.9C4.2009 10.2475 4.49273 10.1501 4.73754 9.97501C4.98236 9.79991 5.16883 9.55521 5.27273 9.27273C5.39374 8.99853 5.42984 8.69437 5.37637 8.39944C5.3229 8.10451 5.18231 7.83235 4.97273 7.61818L4.91818 7.56364C4.74913 7.39478 4.61503 7.19425 4.52353 6.97353C4.43203 6.7528 4.38493 6.51621 4.38493 6.27727C4.38493 6.03834 4.43203 5.80174 4.52353 5.58102C4.61503 5.36029 4.74913 5.15977 4.91818 4.99091C5.08704 4.82186 5.28757 4.68775 5.50829 4.59626C5.72901 4.50476 5.96561 4.45766 6.20455 4.45766C6.44348 4.45766 6.68008 4.50476 6.9008 4.59626C7.12152 4.68775 7.32205 4.82186 7.49091 4.99091L7.54545 5.04545C7.75962 5.25503 8.03178 5.39562 8.32671 5.4491C8.62164 5.50257 8.9258 5.46647 9.2 5.34545H9.27273C9.54161 5.23022 9.77093 5.03887 9.93245 4.79497C10.094 4.55107 10.1807 4.26526 10.1818 3.97273V3.81818C10.1818 3.33597 10.3734 2.87351 10.7144 2.53253C11.0553 2.19156 11.5178 2 12 2C12.4822 2 12.9447 2.19156 13.2856 2.53253C13.6266 2.87351 13.8182 3.33597 13.8182 3.81818V3.9C13.8193 4.19253 13.906 4.47834 14.0676 4.72224C14.2291 4.96614 14.4584 5.15749 14.7273 5.27273C15.0015 5.39374 15.3056 5.42984 15.6006 5.37637C15.8955 5.3229 16.1676 5.18231 16.3818 4.97273L16.4364 4.91818C16.6052 4.74913 16.8057 4.61503 17.0265 4.52353C17.2472 4.43203 17.4838 4.38493 17.7227 4.38493C17.9617 4.38493 18.1983 4.43203 18.419 4.52353C18.6397 4.61503 18.8402 4.74913 19.0091 4.91818C19.1781 5.08704 19.3122 5.28757 19.4037 5.50829C19.4952 5.72901 19.5423 5.96561 19.5423 6.20455C19.5423 6.44348 19.4952 6.68008 19.4037 6.9008C19.3122 7.12152 19.1781 7.32205 19.0091 7.49091L18.9545 7.54545C18.745 7.75962 18.6044 8.03178 18.5509 8.32671C18.4974 8.62164 18.5335 8.9258 18.6545 9.2V9.27273C18.7698 9.54161 18.9611 9.77093 19.205 9.93245C19.4489 10.094 19.7347 10.1807 20.0273 10.1818H20.1818C20.664 10.1818 21.1265 10.3734 21.4675 10.7144C21.8084 11.0553 22 11.5178 22 12C22 12.4822 21.8084 12.9447 21.4675 13.2856C21.1265 13.6266 20.664 13.8182 20.1818 13.8182H20.1C19.8075 13.8193 19.5217 13.906 19.2778 14.0676C19.0339 14.2291 18.8425 14.4584 18.7273 14.7273Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="recent-open-menu" ref={menuRef}>
            <button
              className="recent-icon-btn primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAppMenu(!showAppMenu)
              }}
              aria-label="Open project"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showAppMenu && (
              <div className="recent-app-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenWith('vscode')
                  }}
                >
                  VS Code
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenWith('cursor')
                  }}
                >
                  Cursor
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenWith('webstorm')
                  }}
                >
                  WebStorm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default RecentProject
