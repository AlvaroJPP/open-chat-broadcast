import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Cast,
  Home,
  LogOut,
  Menu,
  Radio,
  Settings,
  Users,
  X,
} from 'lucide-react'

interface User {
  _id?: string
  id?: string
  nickname?: string
  email?: string
  avatar?: string | null
}

interface RoomsTopNavProps {
  user: User | null
  onLogout?: () => void
}

const itemBase =
  'flex items-center gap-2 border-b-2 px-3.5 text-sm font-semibold transition-colors'

const mobileItemBase =
  'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-sm font-semibold transition-colors'

/**
 * Barra superior da área de salas.
 * Desktop: navegação horizontal completa.
 * Mobile: barra compacta com menu recolhível para evitar que a navegação
 * ocupe toda a parte superior da tela.
 */
export function RoomsTopNav({ user, onLogout }: RoomsTopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const nickname = user?.nickname || 'Usuário'

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <header className="relative z-40 shrink-0 border-b border-border bg-background">
      <div className="flex h-[60px] w-full min-w-0 items-center gap-2 px-3 sm:px-4 md:gap-6 md:px-6">
        <Link
          to="/rooms"
          onClick={closeMobileMenu}
          className="flex min-w-0 shrink items-center gap-2 md:shrink-0 md:gap-2.5"
          aria-label="Open Chat Broadcast — Salas"
        >
          <span className="flex size-8 shrink-0 items-center justify-center border border-foreground">
            <Cast className="size-[18px]" />
          </span>
          <span className="min-w-0 truncate text-sm font-bold sm:text-base">
            Open Chat <span className="text-primary">Broadcast</span>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="ml-2 hidden h-full items-stretch md:ml-4 md:flex"
        >
          <Link
            to="/rooms"
            className={`${itemBase} border-transparent text-muted-foreground hover:text-foreground`}
            activeProps={{
              className: `${itemBase} border-primary text-foreground`,
            }}
          >
            Salas
          </Link>
          {[
            { label: 'Transmissões', Icon: Radio },
            { label: 'Participantes', Icon: Users },
            { label: 'Configurações', Icon: Settings },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              className={`${itemBase} border-transparent text-muted-foreground hover:text-foreground`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <div
          className="flex h-9 min-w-0 shrink-0 items-center gap-2 border border-border px-2 md:h-10 md:gap-2.5 md:px-3"
          title={nickname}
        >
          <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted text-xs font-bold">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={nickname}
                className="size-full object-cover"
              />
            ) : (
              nickname.charAt(0).toUpperCase()
            )}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">
            {nickname}
          </span>
          <span className="size-[7px] shrink-0 bg-primary" title="Online" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Sair"
          title="Sair"
          className="flex size-9 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground md:size-10"
        >
          <LogOut className="size-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="rooms-mobile-menu"
          className="flex size-9 shrink-0 items-center justify-center border border-border text-foreground hover:bg-muted md:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          id="rooms-mobile-menu"
          aria-label="Navegação mobile"
          className="absolute left-0 right-0 top-full flex flex-col border-b border-border bg-card shadow-lg md:hidden"
        >
          <Link
            to="/rooms"
            onClick={closeMobileMenu}
            className={`${mobileItemBase} border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground`}
            activeProps={{
              className: `${mobileItemBase} border-l-primary bg-muted text-primary`,
            }}
          >
            <Home className="size-5 shrink-0" />
            Salas
          </Link>
          {[
            { label: 'Transmissões', Icon: Radio },
            { label: 'Participantes', Icon: Users },
            { label: 'Configurações', Icon: Settings },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={closeMobileMenu}
              className={`${mobileItemBase} border-l-transparent text-left text-muted-foreground hover:bg-muted hover:text-foreground`}
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}
