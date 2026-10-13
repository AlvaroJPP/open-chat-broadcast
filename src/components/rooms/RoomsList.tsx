import { useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search, Users, LockKeyhole, Globe } from 'lucide-react'

export interface RoomListItem {
  _id: string
  name: string
  maxParticipants: number
  participants?: unknown[]
  status: 'waiting' | 'active' | 'closed'
  visibility?: 'public' | 'private'
}

type Filter = 'all' | 'open' | 'closed'

interface RoomsListProps {
  rooms: RoomListItem[]
  loading: boolean
  submitting: boolean
  onRefresh: () => void
  onJoin: (roomId: string) => void
  onCreate: () => void
}

const ORDER = { active: 0, waiting: 1, closed: 2 } as const

function StatusTag({ status }: { status: RoomListItem['status'] }) {
  if (status === 'active') {
    return (
      <span className="bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
        AO VIVO
      </span>
    )
  }

  if (status === 'closed') {
    return (
      <span className="border border-destructive/50 px-2 py-0.5 text-[11px] font-semibold text-red-400">
        Fechada
      </span>
    )
  }

  return (
    <span className="border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Aguardando
    </span>
  )
}

export function RoomsList({
  rooms,
  loading,
  submitting,
  onRefresh,
  onJoin,
  onCreate,
}: RoomsListProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: rooms.length,
      open: rooms.filter((r) => r.status !== 'closed').length,
      closed: rooms.filter((r) => r.status === 'closed').length,
    }),
    [rooms]
  )

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()

    return rooms
      .filter((room) => {
        if (filter === 'open' && room.status === 'closed') return false
        if (filter === 'closed' && room.status !== 'closed') return false
        if (term && !room.name.toLowerCase().includes(term)) return false
        return true
      })
      .sort((a, b) => ORDER[a.status] - ORDER[b.status])
  }, [rooms, filter, query])

  const tabs: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'Todas' },
    { key: 'open', label: 'Abertas' },
    { key: 'closed', label: 'Fechadas' },
  ]

  return (
    <section
      aria-label="Salas disponíveis"
      className="mx-auto max-w-6xl px-4 py-8 md:px-8"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold md:text-xl">Salas disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Entre em uma sala existente ou crie uma nova.
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 border border-border bg-card px-3 sm:w-56 sm:flex-none">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar sala"
              placeholder="Buscar sala"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Atualizar"
            className="flex h-11 items-center gap-2 border border-border px-3.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      <div role="tablist" className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`h-11 border-b-2 px-3.5 text-sm font-semibold ${
              filter === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}{' '}
            <span className="text-muted-foreground">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="border-b border-border py-12 text-center">
          <Users className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Nenhuma sala disponível</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Seja o primeiro a criar uma sala.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 h-11 bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Criar sala
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="border-b border-border py-10 text-center text-sm text-muted-foreground">
          Nenhuma sala encontrada.
        </p>
      ) : (
        <ul>
          <li
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1.6fr)_130px_90px_150px] gap-4 border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:grid"
          >
            <span>Sala</span>
            <span>Status</span>
            <span>Pessoas</span>
            <span />
          </li>

          {visible.map((room) => {
            const closed = room.status === 'closed'

            return (
              <li
                key={room._id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b border-border px-4 py-3.5 md:grid-cols-[minmax(0,1.6fr)_130px_90px_150px]"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{room.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    ID: {room._id}
                  </p>
                </div>

                <div className="justify-self-end md:justify-self-start">
                  <StatusTag status={room.status} />
                </div>

                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {room.participants?.length || 0}/{room.maxParticipants}
                </span>

                <button
                  type="button"
                  disabled={submitting || closed}
                  onClick={() => onJoin(room._id)}
                  className={`h-11 whitespace-nowrap px-5 text-sm font-bold md:h-10 ${
                    closed
                      ? 'cursor-not-allowed border border-border font-semibold text-muted-foreground'
                      : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
                  }`}
                >
                  {closed ? 'Sala fechada' : 'Entrar na sala'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
