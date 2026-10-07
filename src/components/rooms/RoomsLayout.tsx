import type { ReactNode } from 'react'

interface RoomsLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function RoomsLayout({
  sidebar,
  children,
}: RoomsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {sidebar}

      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}