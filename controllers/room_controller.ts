import type { Request, Response } from "express";

import roomModel from "../models/room_model.ts";
import { removeParticipant } from "../services/websocket/room.ts";


type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

const roomController = {
    model: roomModel,


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
                    .populate("owner")
                    .populate("participants.user");

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
            const canViewPrivateRoom =
                room.visibility !== "private" ||
                room.owner.toString() === userId ||
                room.participants.some((participant: RoomParticipant) =>
                    participant.user.toString() === userId
                );

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

            if (room.visibility === "private" && !alreadyParticipant && req.body?.code !== id) {
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