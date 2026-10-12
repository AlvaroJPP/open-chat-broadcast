export type WebSocketMessage<T = unknown> = {
  event: string
  data: T
}

type MessageHandler = (message: WebSocketMessage) => void

type RoomJoinData = {
  user: string
  room: string
}

export class BroadcastWebSocket {
  private socket: WebSocket | null = null

  private handlers = new Set<MessageHandler>()

  private reconnectTimer: number | null = null

  private reconnectAttempts = 0

  private manualDisconnect = false

  private connectingPromise: Promise<void> | null = null

  private desiredRoom: RoomJoinData | null = null

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.connectingPromise) {
      return this.connectingPromise
    }

    this.manualDisconnect = false

    const apiUrl = import.meta.env["VITE_API_URL"]?.trim()

    if (!apiUrl) {
      throw new Error("[WS] A variável VITE_API_URL não está configurada.")
    }

    const websocketBaseUrl = apiUrl
      .replace(/^https:/i, "wss:")
      .replace(/^http:/i, "ws:")
      .replace(/\/+$/, "")

    const socketUrl = `${websocketBaseUrl}/ws`

    const socket = new WebSocket(socketUrl)

    this.socket = socket

    let settled = false

    let resolveConnection!: () => void
    let rejectConnection!: (error: Error) => void

    const connectionPromise = new Promise<void>((resolve, reject) => {
      resolveConnection = resolve
      rejectConnection = reject
    })

    this.connectingPromise = connectionPromise

    const finishConnection = () => {
      if (settled) return

      settled = true

      if (this.connectingPromise === connectionPromise) {
        this.connectingPromise = null
      }

      resolveConnection()
    }

    const failConnection = (error: Error) => {
      if (settled) return

      settled = true

      if (this.connectingPromise === connectionPromise) {
        this.connectingPromise = null
      }

      rejectConnection(error)
    }

    socket.onopen = () => {
      const isReconnection = this.reconnectAttempts > 0

      console.log("[WS] Conectado.")

      this.reconnectAttempts = 0

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      finishConnection()

      /*
       * Em uma reconexão, restaura a sala anterior.
       * Os handlers continuam registrados nesta instância.
       */
      if (isReconnection && this.desiredRoom) {
        socket.send(
          JSON.stringify({
            event: "room:join",
            data: this.desiredRoom,
          }),
        )

        console.log("[WS] Reentrada na sala solicitada.")
      }
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage

        for (const handler of this.handlers) {
          try {
            handler(message)
          } catch (error) {
            console.error("[WS] Erro em um listener:", error)
          }
        }
      } catch (error) {
        console.error("[WS] Mensagem inválida:", error)
      }
    }

    socket.onerror = event => {
      console.error("[WS] Erro de conexão:", event)

      if (socket.readyState !== WebSocket.OPEN) {
        failConnection(new Error("Não foi possível conectar ao WebSocket."))
      }
    }

    socket.onclose = () => {
      console.log("[WS] Desconectado.")

      if (this.socket === socket) {
        this.socket = null
      }

      if (!settled) {
        failConnection(new Error("A conexão WebSocket foi fechada."))
      }

      if (this.manualDisconnect) {
        return
      }

      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 5000)

      this.reconnectAttempts += 1

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer)
      }

      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null

        void this.connect().catch(error => {
          console.error("[WS] Falha ao reconectar:", error)
        })
      }, delay)
    }

    return connectionPromise
  }

  disconnect(): void {
    this.manualDisconnect = true

    /*
     * Uma desconexão intencional não deve provocar
     * uma reentrada automática na sala.
     */
    this.desiredRoom = null

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const socket = this.socket

    if (!socket) {
      return
    }

    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = null
      socket.onerror = null
      socket.onclose = null
      socket.onmessage = null

      socket.close()

      this.socket = null
      this.connectingPromise = null

      return
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.close()
    }

    this.socket = null
  }

  send<T = unknown>(event: string, data: T): void {
    if (event === "room:join") {
      const roomData = data as RoomJoinData

      if (roomData?.user && roomData?.room) {
        this.desiredRoom = {
          user: roomData.user,
          room: roomData.room,
        }
      }
    }

    if (event === "room:leave") {
      const roomData = data as Partial<RoomJoinData>

      if (
        this.desiredRoom &&
        this.desiredRoom.user === roomData.user &&
        this.desiredRoom.room === roomData.room
      ) {
        this.desiredRoom = null
      }
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error(`[WS] Não conectado. Evento não enviado: ${event}`)

      return
    }

    this.socket.send(
      JSON.stringify({
        event,
        data,
      }),
    )
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)

    return () => {
      this.handlers.delete(handler)
    }
  }

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}
