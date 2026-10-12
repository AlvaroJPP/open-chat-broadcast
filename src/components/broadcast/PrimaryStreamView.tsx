import type {RefObject} from "react"

import {RemoteVideo} from "./RemoteVideo"
import {VolumeControl} from "./VolumeControl"
import type {StreamQuality} from "@/hooks/webrtc/webrtc.types"

interface PrimaryStreamViewProps {
  fullscreenRef: RefObject<HTMLDivElement | null>
  isFullscreen: boolean
  onToggleFullscreen: () => void | Promise<void>

  primaryStream: MediaStream | null
  primaryStreamLabel: string
  isPrimaryLocal: boolean

  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void

  streamQuality: StreamQuality
  onStreamQualityChange: (quality: StreamQuality) => void
}

export function PrimaryStreamView({
  fullscreenRef,
  isFullscreen,
  onToggleFullscreen,
  primaryStream,
  primaryStreamLabel,
  isPrimaryLocal,
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
  streamQuality,
  onStreamQualityChange,
}: PrimaryStreamViewProps) {
  return (
    <div
      ref={fullscreenRef}
      className={`relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black ${
        isFullscreen ? "flex h-screen w-screen items-center justify-center rounded-none" : ""
      }`}
    >
      {primaryStream ? (
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
          {" "}
          <RemoteVideo
            stream={primaryStream}
            volume={volume}
            muted={muted}
            audio={isPrimaryLocal}
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-xs text-white">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate font-medium">{primaryStreamLabel}</span>

              {isPrimaryLocal && (
                <span className="shrink-0 bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                  VOCÊ
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {isPrimaryLocal && (
                <div className="flex items-center gap-1.5">
                  <span className="hidden text-[10px] text-white/70 sm:inline">Qualidade</span>

                  <select
                    value={streamQuality}
                    onChange={event => onStreamQualityChange(event.target.value as StreamQuality)}
                    className="h-8 max-w-[130px] cursor-pointer rounded-md border border-white/20 bg-black/70 px-2 text-[11px] font-medium text-white outline-none transition hover:bg-black/90 focus:border-primary focus:ring-1 focus:ring-primary"
                    aria-label="Qualidade da sua transmissão"
                    title="Qualidade da sua transmissão"
                  >
                    <option value="auto">Automática</option>
                    <option value="360p">360p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="1080p60">1080p • 60 FPS</option>
                  </select>
                </div>
              )}

              <VolumeControl
                volume={volume}
                muted={muted}
                onVolumeChange={onVolumeChange}
                onMutedChange={onMutedChange}
                label="Volume da transmissão"
              />

              <button
                type="button"
                onClick={() => void onToggleFullscreen()}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white transition hover:bg-white/20"
                aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M8 3v5H3" />
                    <path d="M3 8l5-5" />
                    <path d="M16 3v5h5" />
                    <path d="M21 8l-5-5" />
                    <path d="M8 21v-5H3" />
                    <path d="M3 16l5 5" />
                    <path d="M16 21v-5h5" />
                    <path d="M21 16l-5 5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>

              <span className="bg-destructive px-2 py-0.5 text-[11px] font-bold">AO VIVO</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Aguardando transmissão...</p>
        </div>
      )}
    </div>
  )
}
