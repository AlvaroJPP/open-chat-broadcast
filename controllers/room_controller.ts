import { Request, Response } from "express";

import roomModel from "../models/room_model.ts";


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
                owner,
                broadcast,
                maxParticipants
            } = req.body;

            if (!name || !owner) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "Name e owner são obrigatórios."
                    }
                });
            }

            const room =
                await roomModel.create({
                    name,
                    owner,
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
            const rooms =
                await roomModel.find();

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
            const room =
                await roomModel.findById(
                    req.params.id
                );

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
            const {
                user
            } = req.body;

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
                await roomModel.findById(
                    req.params.id
                );

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
            const {
                user
            } = req.body;

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
                await roomModel.findById(
                    req.params.id
                );

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

            const wasOwner =
                room.owner.toString() === user;

            // Remove o participante
            room.participants.splice(
                participantIndex,
                1
            );

            // Se era o proprietário
            if (wasOwner) {
                if (room.participants.length === 0) {
                    // Não existem mais participantes
                    room.status = "closed";
                } else {
                    // O participante mais antigo assume a sala
                    const oldestParticipant =
                        [...room.participants].sort(
                            (
                                a: RoomParticipant,
                                b: RoomParticipant
                            ) =>
                                a.joinedAt.getTime() -
                                b.joinedAt.getTime()
                        )[0];

                    room.owner =
                        oldestParticipant.user;

                    room.status = "active";
                }
            } else if (
                room.participants.length === 0
            ) {
                room.status = "closed";
            }

            await room.save();

            return res.status(200).json({
                success: true,
                data: room
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
            const {
                name,
                broadcast,
                maxParticipants,
                status
            } = req.body;

            const room =
                await roomModel.findByIdAndUpdate(
                    req.params.id,
                    {
                        name,
                        broadcast,
                        maxParticipants,
                        status
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

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
            const room =
                await roomModel.findByIdAndDelete(
                    req.params.id
                );

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