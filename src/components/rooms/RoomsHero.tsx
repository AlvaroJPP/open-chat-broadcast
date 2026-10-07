import { Plus, DoorOpen } from 'lucide-react'

interface RoomsHeroProps {
  onCreateRoom: () => void
  onJoinRoom: () => void
}

export function RoomsHero({
  onCreateRoom,
  onJoinRoom,
}: RoomsHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Open Chat Broadcast
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            MAIS QUE UMA SALA,
            <br />
            UMA CONEXÃO.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Crie uma sala, convide outras pessoas e
            compartilhe sua transmissão em tempo real.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCreateRoom}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" />
              Criar sala
            </button>

            <button
              type="button"
              onClick={onJoinRoom}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted"
            >
              <DoorOpen className="size-4" />
              Entrar em uma sala
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}