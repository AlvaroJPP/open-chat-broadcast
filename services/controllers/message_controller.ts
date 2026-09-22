import { Request, Response } from "express";

import messageModel from "../models/message_model.js";
import roomModel from "../models/room_model.js";


type RoomParticipant = {
    user: {
        toString(): string;
    };

    joinedAt: Date;
};

const messageController = {
    model: messageModel,

    // Buscar mensagens de uma sala
    async findByRoom(req: Request, res: Response) {
        try {
            const { roomId } = req.params;

            const room =
                await roomModel.findById(roomId);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Sala não encontrada."
                    }
                });
            }

            const messages =
                await messageModel
                    .find({
                        room: roomId
                    })
                    .sort({
                        createdAt: 1
                    });

            return res.status(200).json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error(
                "[MESSAGE] Erro ao buscar mensagens:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar mensagens."
                }
            });
        }
    },

    // Criar uma mensagem
    async create(req: Request, res: Response) {
        try {
            const {
                user,
                content,
                type,
                media,
                replyTo
            } = req.body;

            const { roomId } = req.params;

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "User é obrigatório."
                    }
                });
            }

            const room =
                await roomModel.findById(roomId);

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

            const participant =
                room.participants.some(
                    (participant: RoomParticipant) =>
                        participant.user.toString() ===
                        user
                );

            if (!participant) {
                return res.status(403).json({
                    success: false,
                    error: {
                        status: 403,
                        message: "Usuário não participa da sala."
                    }
                });
            }

            if (!content && !media) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message:
                            "A mensagem precisa possuir conteúdo ou mídia."
                    }
                });
            }

            const message =
                await messageModel.create({
                    room: roomId,
                    user,
                    content: content || "",
                    type: type || "text",
                    media: media || null,
                    replyTo: replyTo || null
                });

            return res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            console.error(
                "[MESSAGE] Erro ao criar mensagem:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao criar mensagem."
                }
            });
        }
    },

    // Excluir uma mensagem
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const message =
                await messageModel.findById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Mensagem não encontrada."
                    }
                });
            }

            await messageModel.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                data: null
            });
        } catch (error) {
            console.error(
                "[MESSAGE] Erro ao excluir mensagem:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao excluir mensagem."
                }
            });
        }
    }
};

export default messageController;