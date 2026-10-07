import { Link } from '@tanstack/react-router'
import {
  Cast,
  DoorOpen,
  Home,
  LogOut,
  Plus,
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

interface RoomsSidebarProps {
  user: User | null
  onLogout?: () => void
}

export function RoomsSidebar({
  user,
  onLogout,
}: RoomsSidebarProps) {
  const nickname = user?.nickname || 'Usuário'

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-border px-6">
        <Link
          to="/rooms"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Cast className="size-5" />
          </span>

          <span className="text-sm font-semibold">
            Open Chat{' '}
            <span className="text-success">
              Broadcast
            </span>
          </span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-4">
        <Link
          to="/rooms"
          activeProps={{
            className:
              'flex items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary',
          }}
          inactiveProps={{
            className:
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
          }}
        >
          <Home className="size-4" />
          Salas
        </Link>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Radio className="size-4" />
          Transmissões
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Users className="size-4" />
          Participantes
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
          Configurações
        </button>
      </nav>

      {/* Usuário */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={nickname}
                className="size-full object-cover"
              />
            ) : (
              nickname.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {nickname}
            </p>

            <p className="truncate text-xs text-muted-foreground">
              Online
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}