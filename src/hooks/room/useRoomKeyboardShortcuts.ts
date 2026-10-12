import { useEffect } from "react"

interface UseRoomKeyboardShortcutsProps {
enabled: boolean
onEscape: () => void
}

export function useRoomKeyboardShortcuts({
enabled,
onEscape,
}: UseRoomKeyboardShortcutsProps) {
useEffect(() => {
if (!enabled) return


const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    onEscape()
  }
}

document.addEventListener("keydown", handleKeyDown)

return () => {
  document.removeEventListener("keydown", handleKeyDown)
}


}, [enabled, onEscape])
}
