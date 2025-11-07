export async function detectFrameworks(projectPath: string): Promise<string[]> {
  try {
    const result = await window.api.fs.readPackageJson(projectPath)
    if (!result.success || !result.data) {
      return []
    }

    const packageJson = result.data
    const frameworks: string[] = []
    const deps = {
      ...((packageJson.dependencies as Record<string, string>) || {}),
      ...((packageJson.devDependencies as Record<string, string>) || {})
    }

    // Framework detection rules (prioritize main frameworks)
    const frameworkRules: Record<string, string> = {
      react: 'React',
      vue: 'Vue',
      next: 'Next.js',
      '@angular/core': 'Angular',
      svelte: 'Svelte',
      nuxt: 'Nuxt',
      gatsby: 'Gatsby',
      astro: 'Astro',
      'solid-js': 'Solid',
      qwik: 'Qwik',
      express: 'Express',
      fastify: 'Fastify',
      nestjs: 'NestJS',
      electron: 'Electron',
      vite: 'Vite',
      webpack: 'Webpack',
      typescript: 'TypeScript'
    }

    // Check for frameworks in order of priority
    for (const [pkg, label] of Object.entries(frameworkRules)) {
      if (deps[pkg]) {
        frameworks.push(label)
      }
    }

    // Limit to top 3 most important frameworks
    return frameworks.slice(0, 3)
  } catch (error) {
    console.error('Error detecting frameworks:', error)
    return []
  }
}
