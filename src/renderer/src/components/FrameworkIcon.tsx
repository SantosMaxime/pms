type FrameworkIconProps = {
  framework: string
}

export function FrameworkIcon({ framework }: FrameworkIconProps): React.JSX.Element {
  const lowerFramework = framework.toLowerCase()

  // React
  if (lowerFramework.includes('react')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <ellipse
          cx="12"
          cy="12"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          transform="rotate(120 12 12)"
        />
      </svg>
    )
  }

  // Vue
  if (lowerFramework.includes('vue') || lowerFramework.includes('nuxt')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 4L12 20L22 4H17L12 13L7 4H2Z" fill="currentColor" />
      </svg>
    )
  }

  // Angular
  if (lowerFramework.includes('angular')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L3 6L4.5 18L12 22L19.5 18L21 6L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M12 6L8 16H10L11 13H13L14 16H16L12 6Z" fill="currentColor" />
      </svg>
    )
  }

  // Next.js
  if (lowerFramework.includes('next')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 9L15 15M15 9V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // TypeScript
  if (lowerFramework.includes('typescript')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M9 8H15M12 8V16M14 14V16H16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Node.js / Express / Fastify / NestJS
  if (
    lowerFramework.includes('express') ||
    lowerFramework.includes('fastify') ||
    lowerFramework.includes('nest')
  ) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L3 7V17L12 21L21 17V7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M12 12L3 7M12 12L21 7M12 12V21" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  // Electron
  if (lowerFramework.includes('electron')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <ellipse
          cx="12"
          cy="12"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          transform="rotate(45 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          transform="rotate(-45 12 12)"
        />
      </svg>
    )
  }

  // Vite
  if (lowerFramework.includes('vite')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3L3 9L12 15L21 9L12 3Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M12 15V21" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  // Webpack
  if (lowerFramework.includes('webpack')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L4 7V17L12 21L20 17V7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M12 9L8 11V15L12 17L16 15V11L12 9Z" fill="currentColor" />
      </svg>
    )
  }

  // Svelte
  if (lowerFramework.includes('svelte')) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 8C18 5.79 16.21 4 14 4H10C7.79 4 6 5.79 6 8C6 10.21 7.79 12 10 12H14C16.21 12 18 13.79 18 16C18 18.21 16.21 20 14 20H10C7.79 20 6 18.21 6 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Astro / Gatsby / Solid / Qwik - Generic star/framework icon
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M9 9L15 15M15 9L9 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
