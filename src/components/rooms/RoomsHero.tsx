import { useState } from 'react'
import { MonitorPlay, Plus, Users } from 'lucide-react'

export interface LiveRoom {
  code: string
  name: string
  count: number
}

interface RoomsHeroProps {
  onCreateRoom: () => void
  /** Entra usando um código ou link colado no campo. */
  onJoinByCode: (code: string) => void
  /** Sala ativa em destaque ("Ao vivo agora"), se existir. */
  liveRoom?: LiveRoom | null
  onJoinLive?: (code: string) => void
  disabled?: boolean
}

export function RoomsHero({
  onCreateRoom,
  onJoinByCode,
  liveRoom,
  onJoinLive,
  disabled,
}: RoomsHeroProps) {
  const [code, setCode] = useState('')

  return (
    <section className="border-b border-border">
      <div
        className={`mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 md:py-10 ${
          liveRoom ? 'lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12' : ''
        }`}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Open Chat Broadcast
          </p>

          <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Mais que uma sala,
            <br />
            uma conexão.
          </h1>

          <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
            Crie uma sala, convide outras pessoas e compartilhe sua
            transmissão em tempo real.
          </p>

          <button
            type="button"
            onClick={onCreateRoom}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-primary-foreground hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-5" />
            Criar sala
          </button>

          <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Ou entre com um código
          </p>

          <form
            className="flex max-w-md"
            onSubmit={(event) => {
              event.preventDefault()
              onJoinByCode(code)
            }}
          >
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-label="Código da sala"
              placeholder="Cole o código ou link da sala"
              className="h-12 min-w-0 flex-1 border border-r-0 border-input bg-card px-3.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={disabled}
              className="h-12 border border-foreground px-5 text-sm font-bold hover:bg-muted disabled:opacity-50"
            >
              Entrar
            </button>
          </form>
        </div>

        {liveRoom && (
          <div className="border border-border bg-card">
            <div className="relative flex aspect-video items-center justify-center bg-black text-muted-foreground">
              <MonitorPlay className="size-9" />
              <span className="absolute left-2.5 top-2.5 bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                AO VIVO
              </span>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Ao vivo agora
                </p>
                <p className="truncate text-lg font-bold">{liveRoom.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {liveRoom.count}{' '}
                  {liveRoom.count === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onJoinLive?.(liveRoom.code)}
                className="h-11 bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Entrar na sala
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
