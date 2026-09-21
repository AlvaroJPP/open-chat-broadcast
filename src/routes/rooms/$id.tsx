import { createFileRoute } from "@tanstack/react-router";

import { RoomLayout } from "@/components/broadcast/RoomLayout";
import { mockMessages, mockParticipants, mockRoom } from "@/lib/mock-data";

export const Route = createFileRoute("/rooms/$id")({
  component: RoomPage,
});

function RoomPage() {
  const { id } = Route.useParams();

  // TODO: substituir os mocks por dados reais vindos da API/Socket.IO
  // usando `id` para buscar a sala (ex.: getRoom(id), conectar socket na room `id`).
  const room = { ...mockRoom, id };

  return <RoomLayout room={room} participants={mockParticipants} messages={mockMessages} />;
}