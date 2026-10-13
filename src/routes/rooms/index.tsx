import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import { RoomsLayout } from '../../components/rooms/RoomsLayout'
import { RoomsTopNav } from '../../components/rooms/RoomsTopNav'
import { RoomsHero } from '../../components/rooms/RoomsHero'
import { RoomsList } from '../../components/rooms/RoomsList'
import { BroadcastWebSocket } from '../../lib/websocket'
import { API_BASE_URL } from '../../lib/config'

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
  visibility?: 'public' | 'private'
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
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  const [roomId, setRoomId] = useState('')

  /**
   * Carrega o usuário atual.
   */
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
      const parsedUser =
        JSON.parse(storedUser)

      setUser(parsedUser)
    } catch {
      localStorage.removeItem(
        'currentUser'
      )

      navigate({
        to: '/auth/login',
      })
    }
  }, [navigate])

  /**
   * Carrega as salas.
   */
  async function loadRooms() {
    try {
      setError(null)

      const response =
        await fetch(`${API_BASE_URL}/rooms`, {
          credentials: 'include',
        })

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result?.error?.message ||
            'Não foi possível carregar as salas.'
        )
      }

      setRooms(
        result.data || []
      )
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

  /**
   * Primeira carga das salas.
   */
  useEffect(() => {
    if (!user) {
      return
    }

    void loadRooms()
  }, [user])

  /**
   * WebSocket da página de salas.
   *
   * Recebe room:updated sempre que uma sala
   * sofrer alteração.
   */
  useEffect(() => {
    if (!user) {
      return
    }

    const websocket =
      new BroadcastWebSocket()

    let unsubscribe:
      | (() => void)
      | null = null

    let active = true

    async function connect() {
      try {
        await websocket.connect()

        if (!active) {
          websocket.disconnect()
          return
        }

        unsubscribe =
          websocket.onMessage(
            (message) => {
              if (
                message.event !==
                'room:updated'
              ) {
                return
              }

              /**
               * Não mostramos loading durante
               * uma atualização automática.
               */
              void loadRooms()
            }
          )
      } catch (error) {
        console.error(
          '[ROOMS] Falha ao conectar WebSocket:',
          error
        )
      }
    }

    void connect()

    return () => {
      active = false

      unsubscribe?.()

      websocket.disconnect()
    }
  }, [user])

  /**
   * Atualização manual.
   */
  async function handleRefresh() {
    try {
      setLoading(true)

      await loadRooms()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Cria uma sala.
   */
  async function handleCreateRoom() {
    const userId =
      getUserId(user)

    if (!userId) {
      setError(
        'Não foi possível identificar o usuário logado.'
      )

      return
    }

    if (!roomName.trim()) {
      setError(
        'Informe o nome da sala.'
      )

      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response =
        await fetch(`${API_BASE_URL}/rooms`, {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            name:
              roomName.trim(),

            owner:
              userId,

            maxParticipants:
              Number(
                maxParticipants
              ) || 100,
            visibility,
          }),
        })

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result?.error?.message ||
            'Não foi possível criar a sala.'
        )
      }

      const room =
        result.data as Room

      setShowCreate(false)
      setRoomName('')
      setMaxParticipants('100')
      setVisibility('public')

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

  /**
   * Entra em uma sala.
   */
  async function handleJoinRoom(
    id: string,
    accessCode?: string
  ) {
    const userId =
      getUserId(user)

    if (!userId) {
      setError(
        'Não foi possível identificar o usuário logado.'
      )

      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response =
        await fetch(
          `${API_BASE_URL}/rooms/${id}/join`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials: 'include',

            body: JSON.stringify({
              user: userId,
              ...(accessCode ? { code: accessCode } : {}),
            }),
          }
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
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

  /**
   * Logout.
   */
  function handleLogout() {
    localStorage.removeItem(
      'currentUser'
    )

    navigate({
      to: '/auth/login',
    })
  }

  /**
   * Abre modal de entrada por ID.
   */
  function openJoinModal() {
    setError(null)
    setRoomId('')
    setShowJoin(true)
  }

  /**
   * Entra utilizando o ID digitado.
   */
  async function handleJoinById() {
    const id =
      roomId.trim()

    if (!id) {
      setError(
        'Informe o ID da sala.'
      )

      return
    }

    await handleJoinRoom(id, id)
  }

  /**
   * Entra usando um código ou link colado no campo do destaque.
   */
  async function handleJoinByCode(code: string) {
    const id = code.trim().split('/').filter(Boolean).pop()

    if (!id) {
      setError('Informe o código ou o link da sala.')

      return
    }

    await handleJoinRoom(id, id)
  }

  /**
   * Sala ativa com mais gente, mostrada em "Ao vivo agora".
   */
  const liveRoom = rooms
    .filter((room) => room.status === 'active' && room.visibility !== 'private')
    .sort(
      (a, b) =>
        (b.participants?.length || 0) - (a.participants?.length || 0)
    )[0]

  return (
    <RoomsLayout
      header={<RoomsTopNav user={user} onLogout={handleLogout} />}
    >
      <RoomsHero
        onCreateRoom={() => {
          setError(null)
          setShowCreate(true)
        }}
        onJoinByCode={handleJoinByCode}
        liveRoom={
          liveRoom
            ? {
                id: liveRoom._id,
                name: liveRoom.name,
                count: liveRoom.participants?.length || 0,
              }
            : null
        }
        onJoinLive={handleJoinRoom}
        disabled={submitting}
      />

      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8">
          <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      <RoomsList
        rooms={rooms}
        loading={loading}
        submitting={submitting}
        onRefresh={handleRefresh}
        onJoin={handleJoinRoom}
        onCreate={() => {
          setError(null)
          setShowCreate(true)
        }}
      />

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
                onClick={() =>
                  setShowCreate(
                    false
                  )
                }
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
                  value={
                    roomName
                  }
                  onChange={(e) =>
                    setRoomName(
                      e.target.value
                    )
                  }
                  placeholder="Minha sala"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Visibilidade da sala
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    aria-pressed={visibility === 'public'}
                    className={`rounded-md border px-3 py-3 text-left text-sm ${visibility === 'public' ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'}`}
                  >
                    <span className="block font-semibold">Pública</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Visível para todos os usuários logados.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    aria-pressed={visibility === 'private'}
                    className={`rounded-md border px-3 py-3 text-left text-sm ${visibility === 'private' ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'}`}
                  >
                    <span className="block font-semibold">Privada</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Só entra quem tiver o código da sala.</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Limite de participantes
                </label>

                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={
                    maxParticipants
                  }
                  onChange={(e) =>
                    setMaxParticipants(
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="button"
                onClick={
                  handleCreateRoom
                }
                disabled={
                  submitting
                }
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-50 disabled:opacity-50"
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
                onClick={() =>
                  setShowJoin(
                    false
                  )
                }
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium">
                Código ou ID da sala
              </label>

              <input
                value={
                  roomId
                }
                onChange={(e) =>
                  setRoomId(
                    e.target.value
                  )
                }
                placeholder="Cole o código ou link da sala"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                type="button"
                onClick={
                  handleJoinById
                }
                disabled={
                  submitting
                }
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