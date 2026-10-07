import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Loader2,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'

import { RoomsLayout } from '../../components/rooms/RoomsLayout'
import { RoomsSidebar } from '../../components/rooms/RoomsSidebar'
import { RoomsHero } from '../../components/rooms/RoomsHero'
import { RoomActionCard } from '../../components/rooms/RoomActionCard'

export const Route = createFileRoute('/rooms/')({
  component: RoomsPage,
})

interface User {
  _id?: string
  id?: string
  nickname?: string
  email?: string
  avatar?: string | null
}

interface Room {
  _id: string
  name: string
  owner: string | User
  broadcast?: unknown
  maxParticipants: number
  participants: Array<{
    user: string | User
    joinedAt: string
  }>
  status: 'waiting' | 'active' | 'closed'
}

function getUserId(user: User | null) {
  return user?._id || user?.id || null
}

function RoomsPage() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const [roomName, setRoomName] = useState('')
  const [maxParticipants, setMaxParticipants] =
    useState('100')

  const [roomId, setRoomId] = useState('')

  useEffect(() => {
    const storedUser =
      localStorage.getItem('currentUser')

    if (!storedUser) {
      navigate({
        to: '/auth/login',
      })

      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
    } catch {
      localStorage.removeItem('currentUser')

      navigate({
        to: '/auth/login',
      })
    }
  }, [navigate])

  async function loadRooms() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/rooms', {
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error?.message ||
            'Não foi possível carregar as salas.'
        )
      }

      setRooms(result.data || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar as salas.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadRooms()
    }
  }, [user])

  async function handleCreateRoom() {
    const userId = getUserId(user)

    if (!userId) {
      setError(
        'Não foi possível identificar o usuário logado.'
      )
      return
    }

    if (!roomName.trim()) {
      setError('Informe o nome da sala.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: roomName.trim(),
          owner: userId,
          maxParticipants:
            Number(maxParticipants) || 100,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error?.message ||
            'Não foi possível criar a sala.'
        )
      }

      const room = result.data as Room

      setShowCreate(false)
      setRoomName('')
      setMaxParticipants('100')

      await loadRooms()

      navigate({
        to: '/rooms/$id',
        params: {
          id: room._id,
        },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível criar a sala.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoinRoom(id: string) {
    const userId = getUserId(user)

    if (!userId) {
      setError(
        'Não foi possível identificar o usuário logado.'
      )
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(
        `/api/rooms/${id}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user: userId,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error?.message ||
            'Não foi possível entrar na sala.'
        )
      }

      navigate({
        to: '/rooms/$id',
        params: {
          id,
        },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar na sala.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')

    navigate({
      to: '/auth/login',
    })
  }

  function openJoinModal() {
    setError(null)
    setRoomId('')
    setShowJoin(true)
  }

  async function handleJoinById() {
    const id = roomId.trim()

    if (!id) {
      setError('Informe o ID da sala.')
      return
    }

    await handleJoinRoom(id)
  }

  return (
    <RoomsLayout
      sidebar={
        <RoomsSidebar
          user={user}
          onLogout={handleLogout}
        />
      }
    >
      <RoomsHero
        onCreateRoom={() => {
          setError(null)
          setShowCreate(true)
        }}
        onJoinRoom={openJoinModal}
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Salas disponíveis
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Entre em uma sala existente ou crie uma nova.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRooms}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">
              Nenhuma sala disponível
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Seja o primeiro a criar uma sala.
            </p>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Criar sala
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {room.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      ID: {room._id}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                      room.status === 'active'
                        ? 'bg-success/10 text-success'
                        : room.status === 'closed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {room.status === 'active'
                      ? 'Ativa'
                      : room.status === 'closed'
                        ? 'Fechada'
                        : 'Aguardando'}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    {room.participants?.length || 0}/
                    {room.maxParticipants}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    submitting ||
                    room.status === 'closed'
                  }
                  onClick={() =>
                    handleJoinRoom(room._id)
                  }
                  className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {room.status === 'closed'
                    ? 'Sala fechada'
                    : 'Entrar na sala'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal criar sala */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Criar sala
              </h2>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Nome da sala
                </label>

                <input
                  value={roomName}
                  onChange={(e) =>
                    setRoomName(e.target.value)
                  }
                  placeholder="Minha sala"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Limite de participantes
                </label>

                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={submitting}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting
                  ? 'Criando...'
                  : 'Criar sala'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal entrar por ID */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Entrar em uma sala
              </h2>

              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium">
                ID da sala
              </label>

              <input
                value={roomId}
                onChange={(e) =>
                  setRoomId(e.target.value)
                }
                placeholder="ID da sala"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                type="button"
                onClick={handleJoinById}
                disabled={submitting}
                className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting
                  ? 'Entrando...'
                  : 'Entrar na sala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoomsLayout>
  )
}