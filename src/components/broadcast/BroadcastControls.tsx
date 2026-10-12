import {
LogOut,
Mic,
MicOff,
MonitorUp,
Video,
VideoOff,
} from "lucide-react"

interface BroadcastControlsProps {
isScreenSharing: boolean
isCameraOn: boolean
isMicOn: boolean
onToggleScreen: () => void
onToggleCamera: () => void
onToggleMic: () => void
onLeave: () => void
}

const pill =
"flex h-14 items-center justify-center gap-2 rounded-full text-xs font-semibold transition-colors sm:h-12 sm:px-5 sm:text-sm"

const toggle =
"flex-col gap-0.5 border border-[oklch(0.38_0.02_250)] bg-[oklch(0.22_0.016_250)] hover:bg-[oklch(0.27_0.02_250)] sm:flex-row sm:gap-2"

export function BroadcastControls({
isScreenSharing,
isCameraOn,
isMicOn,
onToggleScreen,
onToggleCamera,
onToggleMic,
onLeave,
}: BroadcastControlsProps) {
return ( <div
   role="group"
   aria-label="Controles da transmissão"
   className="grid shrink-0 grid-cols-[1fr_1fr_1.6fr_1fr] gap-2 border-t border-border bg-secondary p-2.5 sm:flex sm:h-[76px] sm:items-center sm:justify-center sm:gap-3 sm:p-0"
 >
<button
type="button"
onClick={onToggleMic}
aria-pressed={isMicOn}
aria-label={isMicOn ? "Desligar microfone" : "Ligar microfone"}
className={`${pill} ${toggle} ${isMicOn ? "text-primary" : ""}`}
>
{isMicOn ? ( <Mic className="size-5" />
) : ( <MicOff className="size-5" />
)}
Mic </button>
  <button
    type="button"
    onClick={onToggleCamera}
    aria-pressed={isCameraOn}
    aria-label={isCameraOn ? "Desligar câmera" : "Ligar câmera"}
    className={`${pill} ${toggle} ${isCameraOn ? "text-primary" : ""}`}
  >
    {isCameraOn ? (
      <Video className="size-5" />
    ) : (
      <VideoOff className="size-5" />
    )}
    Câmera
  </button>

  <button
    type="button"
    onClick={onToggleScreen}
    aria-pressed={isScreenSharing}
    aria-label={
      isScreenSharing
        ? "Parar compartilhamento de tela"
        : "Compartilhar tela"
    }
    className={`${pill} font-bold sm:px-7 ${
      isScreenSharing
        ? "bg-destructive text-white hover:opacity-90"
        : "bg-primary text-primary-foreground hover:opacity-90"
    }`}
  >
    <MonitorUp className="size-5" />
    <span>
      {isScreenSharing ? "Parar" : "Transmitir"}
      <span className="hidden sm:inline"> tela</span>
    </span>
  </button>

  <button
    type="button"
    onClick={onLeave}
    aria-label="Sair da sala"
    className={`${pill} flex-col gap-0.5 bg-destructive text-white hover:opacity-90 sm:flex-row sm:gap-2`}
  >
    <LogOut className="size-5" />
    Sair
  </button>
</div>
)
}
