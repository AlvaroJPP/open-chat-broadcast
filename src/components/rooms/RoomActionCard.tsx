import {
  ArrowRight,
  DoorOpen,
  Plus,
  Radio,
} from 'lucide-react'

interface RoomActionCardProps {
  type: 'create' | 'join'
  onClick: () => void
}

export function RoomActionCard({
  type,
  onClick,
}: RoomActionCardProps) {
  const create = type === 'create'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {create ? (
            <Plus className="size-5" />
          ) : (
            <DoorOpen className="size-5" />
          )}
        </div>

        <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>

      <h2 className="text-lg font-semibold">
        {create
          ? 'Criar uma sala'
          : 'Entrar em uma sala'}
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {create
          ? 'Crie uma nova sala e convide outras pessoas para participar.'
          : 'Entre em uma sala existente usando o código ou identificador da sala.'}
      </p>
    </button>
  )
}