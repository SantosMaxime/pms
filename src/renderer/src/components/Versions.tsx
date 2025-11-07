import { useState } from 'react'

type Props = {
  centered?: boolean
  className?: string
}

function Versions({ centered = false, className = '' }: Props): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className={`versions ${centered ? 'centered' : ''} ${className}`.trim()}>
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
