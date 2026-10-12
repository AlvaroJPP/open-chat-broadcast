import type { ReactNode } from 'react'

interface RoomsLayoutProps {
  header: ReactNode
  children: ReactNode
}

export function RoomsLayout({ header, children }: RoomsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {header}

      {/* pb-14: espaço para a barra de abas fixa no celular */}
      <main className="min-w-0 flex-1 pb-14 md:pb-0">{children}</main>
    </div>
  )
}
