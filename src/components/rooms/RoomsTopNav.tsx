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

const mobileItemBase =
  'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-sm font-semibold transition-colors'

/**
 * Navegação da área de salas.
 * No desktop, os links ficam na barra horizontal superior.
 * No celular, os links ficam em uma lista vertical logo abaixo da marca.
 */
export function RoomsTopNav({ user, onLogout }: RoomsTopNavProps) {
  const nickname = user?.nickname || 'Usuário'

  return (
    <header className="z-40 flex shrink-0 flex-col border-b border-border bg-background md:h-[60px] md:flex-row md:items-center md:gap-6 md:px-6">
      <div className="flex min-h-[60px] w-full items-center gap-3 px-4 md:contents">
        <Link to="/rooms" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center border border-foreground">
            <Cast className="size-[18px]" />
          </span>
          <span className="whitespace-nowrap text-sm font-bold sm:text-base">
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

        <div className="flex-1 md:block" />

        <div className="ml-auto flex h-9 min-w-0 items-center gap-2 border border-border px-2 md:ml-0 md:h-10 md:gap-2.5 md:px-3">
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
          <span className="max-w-24 truncate text-xs font-semibold md:max-w-32 md:text-sm">
            {nickname}
          </span>
          <span className="size-[7px] shrink-0 bg-primary" title="Online" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Sair"
          className="flex size-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground md:size-10"
        >
          <LogOut className="size-[18px]" />
        </button>
      </div>

      {/* No celular, os itens ficam um abaixo do outro no menu superior. */}
      <nav
        aria-label="Navegação mobile"
        className="flex flex-col border-t border-border bg-card md:hidden"
      >
        <Link
          to="/rooms"
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
            className={`${mobileItemBase} border-l-transparent text-left text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
