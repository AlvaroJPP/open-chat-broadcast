export type WebSocketMessage<T = unknown> = {
    event: string;
    data: T;
};

type MessageHandler = (
    message: WebSocketMessage
) => void;

export class BroadcastWebSocket {
    private socket: WebSocket | null = null;
    private handlers = new Set<MessageHandler>();

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            const protocol =
                window.location.protocol === "https:"
                    ? "wss:"
                    : "ws:";

            const socketUrl =
                `${protocol}//${window.location.host}/ws`;

            this.socket = new WebSocket(socketUrl);

            this.socket.onopen = () => {
                console.log("[WS] Conectado.");
                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message =
                        JSON.parse(
                            event.data
                        ) as WebSocketMessage;

                    for (const handler of this.handlers) {
                        handler(message);
                    }
                } catch (error) {
                    console.error(
                        "[WS] Mensagem inválida:",
                        error
                    );
                }
            };

            this.socket.onerror = (error) => {
                console.error(
                    "[WS] Erro:",
                    error
                );

                reject(error);
            };

            this.socket.onclose = () => {
                console.log(
                    "[WS] Desconectado."
                );

                this.socket = null;
            };
        });
    }

    disconnect(): void {
        if (!this.socket) {
            return;
        }

        this.socket.close();
        this.socket = null;
    }

    send<T = unknown>(
        event: string,
        data: T
    ): void {
        if (
            !this.socket ||
            this.socket.readyState !==
                WebSocket.OPEN
        ) {
            console.error(
                "[WS] Não conectado."
            );

            return;
        }

        this.socket.send(
            JSON.stringify({
                event,
                data
            })
        );
    }

    onMessage(
        handler: MessageHandler
    ): () => void {
        this.handlers.add(handler);

        return () => {
            this.handlers.delete(handler);
        };
    }

    get connected(): boolean {
        return (
            this.socket?.readyState ===
            WebSocket.OPEN
        );
    }
}