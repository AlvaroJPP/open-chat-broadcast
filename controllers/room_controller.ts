import type { Request, Response } from "express";
import { randomBytes, randomInt, randomUUID } from "node:crypto";

import roomModel from "../models/room_model.ts";
import userModel from "../models/user_model.ts";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "../services/auth/session.ts";
import { removeParticipant } from "../services/websocket/room.ts";


const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function generateInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const chars = Array.from({ length: 8 }, () =>
            INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]
        );
        const code = `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
        const exists = await roomModel.exists({ inviteCode: code });
        if (!exists) return code;
    }
    throw new Error("Não foi possível gerar um código único para a sala.");
}

type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

const roomController = {
    model: roomModel,

    // Entrada temporária por código, sem cadastro ou login tradicional.
    async guestJoin(req: Request, res: Response) {
        let createdGuestId: string | null = null;

        try {
            const code = String(req.body?.code ?? "").trim().toUpperCase();
            const nickname = String(req.body?.nickname ?? "").trim().toLowerCase();

            if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
                return res.status(400).json({
                    success: false,
                    error: { status: 400, message: "Código inválido. Use o formato XXXX-XXXX." }
                });
            }

            if (nickname.length < 3 || nickname.length > 50 || !/^[a-zA-Z0-9_.]+$/.test(nickname)) {
                return res.status(400).json({
                    success: false,
                    error: { status: 400, message: "O apelido deve ter de 3 a 50 caracteres e usar apenas letras, números, ponto ou underline." }
                });
            }

            const room = await roomModel.findOne({ inviteCode: code });

            if (!room || room.status === "closed") {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Sala não encontrada ou já encerrada." }
                });
            }

            if (room.participants.length >= room.maxParticipants) {
                return res.status(409).json({
                    success: false,
                    error: { status: 409, message: "A sala atingiu o limite de participantes." }
                });
            }

            const existingNickname = await userModel.exists({ nickname });
            if (existingNickname) {
                return res.status(409).json({
                    success: false,
                    error: { status: 409, message: "Esse apelido já está em uso. Escolha outro." }
                });
            }

            const guest = await userModel.create({
                email: `guest-${randomUUID()}@guest.ocb.invalid`,
                nickname,
                pwd: randomBytes(20).toString("hex"),
                isGuest: true,
                isMaster: false,
                status: "offline"
            });
            createdGuestId = guest._id.toString();

            room.participants.push({
                user: guest._id,
                joinedAt: new Date()
            });
            room.status = "active";
            await room.save();

            res.cookie(
                sessionCookieName,
                createSessionToken(createdGuestId),
                sessionCookieOptions
            );

            return res.status(201).json({
                success: true,
                data: {
                    user: {
                        _id: createdGuestId,
                        nickname: guest.nickname,
                        avatar: guest.avatar ?? null,
                        isGuest: true
                    },
                    room: {
                        _id: room._id.toString(),
                        name: room.name,
                        inviteCode: room.inviteCode
                    }
                }
            });
        } catch (error) {
            if (createdGuestId) {
                await userModel.findByIdAndDelete(createdGuestId).catch(() => undefined);
            }

            if ((error as { code?: number })?.code === 11000) {
                return res.status(409).json({
                    success: false,
                    error: { status: 409, message: "Esse apelido já está em uso. Escolha outro." }
                });
            }

            console.error("[ROOM] Erro ao criar participante temporário:", error);
            return res.status(500).json({
                success: false,
                error: { status: 500, message: "Não foi possível entrar como participante temporário." }
            });
        }
    },

    // Criar uma sala
    async create(req: Request, res: Response) {
        try {
            const {
                name,
                broadcast,
                maxParticipants,
                visibility = "public"
            } = req.body;
            const owner = res.locals.authUserId as string;

            if (!name || !owner) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "Name e owner são obrigatórios."
                    }
                });
            }

            if (visibility !== "public" && visibility !== "private") {
                return res.status(400).json({
                    success: false,
                    error: { status: 400, message: "A visibilidade deve ser public ou private." }
                });
            }

            const room =
                await roomModel.create({
                    name,
                    owner,
                    visibility,
                    inviteCode: await generateInviteCode(),
                    broadcast: broadcast || null,
                    maxParticipants:
                        maxParticipants || 100,

                    // Quem cria a sala já entra como participante
                    participants: [
                        {
                            user: owner,
                            joinedAt: new Date()
                        }
                    ],

                    status: "waiting"
                });

            return res.status(201).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao criar sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao criar sala."
                }
            });
        }
    },

    // Listar todas as salas
    async findAll(req: Request, res: Response) {
        try {
            const userId = String(res.locals.authUserId);
            const rooms = await roomModel.find({
                $or: [
                    { visibility: { $ne: "private" } },
                    { owner: userId },
                    { "participants.user": userId }
                ]
            });

            // Gera códigos para salas antigas que foram criadas antes desse recurso.
            for (const room of rooms as any[]) {
                if (!room.inviteCode) {
                    room.inviteCode = await generateInviteCode();
                    await room.save();
                }
            }

            return res.status(200).json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao buscar salas:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar salas."
                }
            });
        }
    },

    // Buscar sala pelo ID
    // Buscar sala pelo código de convite (XXXX-XXXX).
    async findByCode(req: Request, res: Response) {
        try {
            const code = String(req.params["code"] ?? "").trim().toUpperCase();

            if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
                return res.status(400).json({
                    success: false,
                    error: { status: 400, message: "Código inválido. Use o formato XXXX-XXXX." }
                });
            }

            const room = await roomModel.findOne({ inviteCode: code });
            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Nenhuma sala encontrada com esse código." }
                });
            }

            if (room.status === "closed") {
                return res.status(409).json({
                    success: false,
                    error: { status: 409, message: "A sala está fechada." }
                });
            }

            return res.status(200).json({ success: true, data: room });
        } catch (error) {
            console.error("[ROOM] Erro ao buscar sala pelo código:", error);
            return res.status(500).json({
                success: false,
                error: { status: 500, message: "Erro ao buscar sala pelo código." }
            });
        }
    },

    async findById(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID da sala é obrigatório."
                    }
                });
            }

            const room =
                await roomModel
                    .findById(id)
                    .populate("owner", "_id nickname avatar status isGuest")
                    .populate("participants.user", "_id nickname avatar status isGuest");

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            const userId = String(res.locals.authUserId);
            const requestingUser = await userModel.findById(userId).select("isGuest");
            if (!requestingUser) {
                return res.status(401).json({
                    success: false,
                    error: { status: 401, message: "Sessão inválida. Entre novamente." }
                });
            }
            const isGuest = requestingUser.isGuest === true;
            const isRoomParticipant = room.participants.some((participant: any) =>
                String(participant.user?._id ?? participant.user) === userId
            );
            const roomOwnerId = String(
                (room.owner as any)?._id ?? room.owner
            );
            const canViewPrivateRoom =
                room.visibility !== "private" ||
                roomOwnerId === userId ||
                isRoomParticipant;

            if (isGuest && !isRoomParticipant) {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Sala não encontrada." }
                });
            }

            if (!canViewPrivateRoom) {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Sala não encontrada." }
                });
            }

            return res.status(200).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao buscar sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar sala."
                }
            });
        }
    },

    // Entrar em uma sala
    async join(req: Request, res: Response) {
        try {
            const user = res.locals.authUserId as string;
            const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "User é obrigatório."
                    }
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID da sala é obrigatório."
                    }
                });
            }

            const room =
                await roomModel.findById(id);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            if (room.status === "closed") {
                return res.status(409).json({
                    success: false,
                    error: {
                        status: 409,
                        message: "A sala está fechada."
                    }
                });
            }

            const alreadyParticipant =
                room.participants.some(
                    (participant: RoomParticipant) =>
                        participant.user.toString() === user
                );

            if (room.visibility === "private" && !alreadyParticipant && String(req.body?.code ?? "").trim().toUpperCase() !== room.inviteCode) {
                return res.status(403).json({
                    success: false,
                    error: { status: 403, message: "Esta sala é privada. Informe o código de acesso correto." }
                });
            }

            if (alreadyParticipant) {
                return res.status(409).json({
                    success: false,
                    error: {
                        status: 409,
                        message: "Usuário já está na sala."
                    }
                });
            }

            if (
                room.participants.length >=
                room.maxParticipants
            ) {
                return res.status(409).json({
                    success: false,
                    error: {
                        status: 409,
                        message: "A sala atingiu o limite de participantes."
                    }
                });
            }

            room.participants.push({
                user,
                joinedAt: new Date()
            });

            room.status = "active";

            await room.save();

            return res.status(200).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao entrar na sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao entrar na sala."
                }
            });
        }
    },

    // Sair de uma sala
    async leave(req: Request, res: Response) {
        try {
            const user = res.locals.authUserId as string;
            const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "User é obrigatório."
                    }
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID da sala é obrigatório."
                    }
                });
            }

            const room =
                await roomModel.findById(id);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            const participantIndex =
                room.participants.findIndex(
                    (participant: RoomParticipant) =>
                        participant.user.toString() === user
                );

            if (participantIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Usuário não está na sala."
                    }
                });
            }

            // Usa a rotina compartilhada com o WebSocket para evitar condições de corrida.
            await removeParticipant(user, id);

            const updatedRoom = await roomModel.findById(id);

            return res.status(200).json({
                success: true,
                data: updatedRoom
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao sair da sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao sair da sala."
                }
            });
        }
    },

    // Atualizar sala
    async update(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID da sala é obrigatório."
                    }
                });
            }

            const roomToUpdate = await roomModel.findById(id);

            if (!roomToUpdate) {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Sala não encontrada." }
                });
            }

            if (roomToUpdate.owner.toString() !== String(res.locals.authUserId)) {
                return res.status(403).json({
                    success: false,
                    error: { status: 403, message: "Somente o proprietário pode alterar a sala." }
                });
            }

            const { name, broadcast, maxParticipants, status, visibility } = req.body;
            const updates: Record<string, unknown> = {};
            if (name !== undefined) updates.name = name;
            if (broadcast !== undefined) updates.broadcast = broadcast;
            if (maxParticipants !== undefined) updates.maxParticipants = maxParticipants;
            if (status !== undefined) updates.status = status;
            if (visibility !== undefined) {
                if (visibility !== "public" && visibility !== "private") {
                    return res.status(400).json({
                        success: false,
                        error: { status: 400, message: "A visibilidade deve ser public ou private." }
                    });
                }
                updates.visibility = visibility;
            }

            const room = await roomModel.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true
            });

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao atualizar sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao atualizar sala."
                }
            });
        }
    },

    // Excluir sala
    async delete(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID da sala é obrigatório."
                    }
                });
            }

            const room = await roomModel.findById(id);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            if (room.owner.toString() !== String(res.locals.authUserId)) {
                return res.status(403).json({
                    success: false,
                    error: { status: 403, message: "Somente o proprietário pode excluir a sala." }
                });
            }

            await roomModel.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                data: null
            });
        } catch (error) {
            console.error(
                "[ROOM] Erro ao excluir sala:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao excluir sala."
                }
            });
        }
    }
};

export default roomController;