'use client'

import dynamic from 'next/dynamic'

// Type App as a component with no props (or use specific props if needed)
const App = dynamic<{}>(() => import('../../app').then(mod => mod.App), { ssr: false })

export function ClientOnly() {
  return <App />
}
