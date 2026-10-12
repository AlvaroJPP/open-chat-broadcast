import type { Participant } from "@/lib/types"
import type { StreamQuality } from "@/hooks/webrtc/webrtc.types"

interface StreamConnectionDebugProps {
currentUser: Participant
connected: boolean
peerDebugLabel: string
remoteStreamCount: number
activeStreamCount: number
primaryId: string | null
isPrimaryLocal: boolean
streamQuality: StreamQuality
lastError: string | null | undefined
}

const streamQualityLabel: Record<StreamQuality, string> = {
auto: "Automática",
"360p": "360p",
"720p": "720p",
"1080p": "1080p",
"1080p60": "1080p • 60 FPS",
}

export function StreamConnectionDebug({
currentUser,
connected,
peerDebugLabel,
remoteStreamCount,
activeStreamCount,
primaryId,
isPrimaryLocal,
streamQuality,
lastError,
}: StreamConnectionDebugProps) {
return (
<> <div className="absolute bottom-2 left-2 z-30 max-w-[60%] rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white"> <div>
eu: {currentUser.id.slice(-4)} | ws:{" "}
{connected ? "ok" : "off"} | https:{" "}
{window.isSecureContext ? "sim" : "NÃO"} </div>

    <div>
      peers: {peerDebugLabel} | streams: {remoteStreamCount} | vídeos:{" "}
      {activeStreamCount}
    </div>

    {primaryId && (
      <div>
        principal: {isPrimaryLocal ? "você" : primaryId.slice(-4)}
      </div>
    )}

    <div>qualidade: {streamQualityLabel[streamQuality]}</div>

    {lastError && (
      <div className="text-red-300">{lastError}</div>
    )}
  </div>

  {!connected && (
    <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
      Conectando ao servidor...
    </div>
  )}
</>


)
}
