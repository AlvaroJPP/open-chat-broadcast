import type { ReactNode } from 'react'

interface RoomsLayoutProps {
  header: ReactNode
  children: ReactNode
}

export function RoomsLayout({ header, children }: RoomsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {header}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
