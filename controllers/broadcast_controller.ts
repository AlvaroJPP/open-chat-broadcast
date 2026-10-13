import type { Request, Response } from "express";

import broadcastModel from "../models/broadcast_model.ts";

const broadcastController = {
    model: broadcastModel,

    // Criar um broadcast
    async create(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                room,
                status,
                visibility,
                startedAt,
                endedAt
            } = req.body;
            const owner = res.locals.authUserId as string;

            if (!title || !owner) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "Title e owner são obrigatórios."
                    }
                });
            }

            const broadcast =
                await broadcastModel.create({
                    title,
                    description,
                    owner,
                    room,
                    status,
                    visibility,
                    startedAt,
                    endedAt
                });

            return res.status(201).json({
                success: true,
                data: broadcast
            });
        } catch (error) {
            console.error(
                "[BROADCAST] Erro ao criar broadcast:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao criar broadcast."
                }
            });
        }
    },

    // Listar todos os broadcasts
    async findAll(req: Request, res: Response) {
        try {
            const broadcasts =
                await broadcastModel.find();

            return res.status(200).json({
                success: true,
                data: broadcasts
            });
        } catch (error) {
            console.error(
                "[BROADCAST] Erro ao buscar broadcasts:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar broadcasts."
                }
            });
        }
    },

    // Buscar broadcast pelo ID
    async findById(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID do broadcast é obrigatório."
                    }
                });
            }

            const broadcast =
                await broadcastModel.findById(id);

            if (!broadcast) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Broadcast não encontrado."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: broadcast
            });
        } catch (error) {
            console.error(
                "[BROADCAST] Erro ao buscar broadcast:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar broadcast."
                }
            });
        }
    },

    // Atualizar broadcast
    async update(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID do broadcast é obrigatório."
                    }
                });
            }

            const existingBroadcast = await broadcastModel.findById(id);

            if (!existingBroadcast) {
                return res.status(404).json({
                    success: false,
                    error: { status: 404, message: "Broadcast não encontrado." }
                });
            }

            if (existingBroadcast.owner.toString() !== String(res.locals.authUserId)) {
                return res.status(403).json({
                    success: false,
                    error: { status: 403, message: "Somente o proprietário pode alterar este broadcast." }
                });
            }

            const { title, description, room, status, visibility, startedAt, endedAt } = req.body;
            const updates: Record<string, unknown> = {};
            if (title !== undefined) updates.title = title;
            if (description !== undefined) updates.description = description;
            if (room !== undefined) updates.room = room;
            if (status !== undefined) updates.status = status;
            if (visibility !== undefined) updates.visibility = visibility;
            if (startedAt !== undefined) updates.startedAt = startedAt;
            if (endedAt !== undefined) updates.endedAt = endedAt;

            const broadcast = await broadcastModel.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true
            });

            if (!broadcast) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Broadcast não encontrado."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: broadcast
            });
        } catch (error) {
            console.error(
                "[BROADCAST] Erro ao atualizar broadcast:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao atualizar broadcast."
                }
            });
        }
    },

    // Excluir broadcast
    async delete(req: Request, res: Response) {
        try {
            const id = req.params["id"];

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "ID do broadcast é obrigatório."
                    }
                });
            }

            const broadcast = await broadcastModel.findById(id);

            if (!broadcast) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Broadcast não encontrado."
                    }
                });
            }

            if (broadcast.owner.toString() !== String(res.locals.authUserId)) {
                return res.status(403).json({
                    success: false,
                    error: { status: 403, message: "Somente o proprietário pode excluir este broadcast." }
                });
            }

            await broadcastModel.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                data: null
            });
        } catch (error) {
            console.error(
                "[BROADCAST] Erro ao excluir broadcast:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao excluir broadcast."
                }
            });
        }
    }
};

export default broadcastController;