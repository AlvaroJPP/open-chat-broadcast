import type { ChatMessageData, Participant, RoomInfo } from "./types";

export const mockRoom: RoomInfo = {
    id: "7f3a9e",
    name: "Sala do Dev",
    isLive: true,
    inviteUrl: "https://openchat.app/room/7f3a9e",
};

export const mockParticipants: Participant[] = [
    {
        id: "yshdev",
        name: "Yshdev",
        isYou: true,
        status: "transmitindo",
        avatarColor: "bg-success",
        isSharingScreen: true,
    },
    {
        id: "maria",
        name: "Maria",
        status: "assistindo",
        avatarColor: "bg-accent",
        micMuted: true,
    },
    {
        id: "alvaro",
        name: "Alvaro",
        status: "assistindo",
        avatarColor: "bg-[oklch(0.55_0.18_300)]",
        micMuted: true,
    },
];

export const mockMessages: ChatMessageData[] = [
    {
        id: "m1",
        author: { id: "maria", name: "Maria", avatarColor: "bg-accent" },
        time: "14:23",
        text: "Show! 👏",
    },
    {
        id: "m2",
        author: { id: "alvaro", name: "Alvaro", avatarColor: "bg-[oklch(0.55_0.18_300)]" },
        time: "14:24",
        text: "Ficou muito bom o layout!",
    },
    {
        id: "m3",
        author: { id: "yshdev", name: "Yshdev", avatarColor: "bg-success" },
        time: "14:25",
        text: "Obrigado! Ainda tô ajustando o chat em tempo real.",
    },
    {
        id: "m4",
        author: { id: "maria", name: "Maria", avatarColor: "bg-accent" },
        time: "14:26",
        text: "Massa! Qual tecnologia você tá usando?",
    },
    {
        id: "m5",
        author: { id: "yshdev", name: "Yshdev", avatarColor: "bg-success" },
        time: "14:27",
        text: "Node + Socket.IO + MongoDB. O stream da tela é via WebRTC direto entre os navegadores.",
    },
    {
        id: "m6",
        author: { id: "alvaro", name: "Alvaro", avatarColor: "bg-[oklch(0.55_0.18_300)]" },
        time: "14:28",
        text: "Top! Já pensou em adicionar um botão de encerrar transmissão?",
    },
    {
        id: "m7",
        author: { id: "yshdev", name: "Yshdev", avatarColor: "bg-success" },
        time: "14:29",
        text: "Sim, já tá no plano. Vou deixar o protótipo bem simples por enquanto.",
    },
    {
        id: "m8",
        author: { id: "maria", name: "Maria", avatarColor: "bg-accent" },
        time: "14:30",
        text: "Boa! 👌",
    },
];