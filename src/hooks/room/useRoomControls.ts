interface UseRoomControlsProps {
isScreenSharing: boolean
isCameraOn: boolean
isMicOn: boolean
startScreenShare: () => void | Promise<unknown>
stopScreenShare: () => void
startCamera: () => void | Promise<unknown>
stopCamera: () => void
startMic: () => void | Promise<unknown>
stopMic: () => void
}

export function useRoomControls({
isScreenSharing,
isCameraOn,
isMicOn,
startScreenShare,
stopScreenShare,
startCamera,
stopCamera,
startMic,
stopMic,
}: UseRoomControlsProps) {
const handleToggleScreen = () => {
if (isScreenSharing) {
stopScreenShare()
} else {
void startScreenShare()
}
}

const handleToggleCamera = () => {
if (isCameraOn) {
stopCamera()
} else {
void startCamera()
}
}

const handleToggleMic = () => {
if (isMicOn) {
stopMic()
} else {
void startMic()
}
}

return {
handleToggleScreen,
handleToggleCamera,
handleToggleMic,
}
}
