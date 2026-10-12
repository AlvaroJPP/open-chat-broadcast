import { Link } from '@tanstack/react-router'
import {
  Cast,
  Home,
  LogOut,
  Radio,
  Settings,
  Users,
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

/**
 * Cabeçalho da área de salas: barra no topo (desktop)
 * e barra de abas fixa embaixo (celular).
 */
export function RoomsTopNav({ user, onLogout }: RoomsTopNavProps) {
  const nickname = user?.nickname || 'Usuário'

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-6 border-b border-border px-4 md:px-6">
        <Link to="/rooms" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center border border-foreground">
            <Cast className="size-[18px]" />
          </span>
          <span className="text-base font-bold">
            Open Chat <span className="text-primary">Broadcast</span>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="ml-4 hidden h-full items-stretch md:flex"
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
          {['Transmissões', 'Participantes', 'Configurações'].map((label) => (
            <button
              key={label}
              type="button"
              className={`${itemBase} border-transparent text-muted-foreground hover:text-foreground`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex h-10 items-center gap-2.5 border border-border px-3">
          <span className="flex size-6 items-center justify-center overflow-hidden border border-border bg-muted text-xs font-bold">
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
          <span className="max-w-32 truncate text-sm font-semibold">
            {nickname}
          </span>
          <span className="size-[7px] bg-primary" title="Online" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Sair"
          className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-[18px]" />
        </button>
      </header>

      {/* Abas no celular */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card md:hidden"
      >
        <Link
          to="/rooms"
          className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent text-[11px] font-semibold text-muted-foreground"
          activeProps={{
            className:
              'flex h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 border-primary text-[11px] font-semibold text-primary',
          }}
        >
          <Home className="size-5" />
          Salas
        </Link>
        {[
          { label: 'Transmissões', Icon: Radio },
          { label: 'Pessoas', Icon: Users },
          { label: 'Ajustes', Icon: Settings },
        ].map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent text-[11px] font-semibold text-muted-foreground"
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
