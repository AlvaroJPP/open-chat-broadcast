import { Request, Response } from "express";

import broadcastModel from "../models/broadcast_model.ts";

const broadcastController = {
    model: broadcastModel,

    // Criar um broadcast
    async create(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                owner,
                room,
                status,
                visibility,
                startedAt,
                endedAt
            } = req.body;

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
            const broadcast =
                await broadcastModel.findById(
                    req.params.id
                );

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
            const {
                title,
                description,
                room,
                status,
                visibility,
                startedAt,
                endedAt
            } = req.body;

            const broadcast =
                await broadcastModel.findByIdAndUpdate(
                    req.params.id,
                    {
                        title,
                        description,
                        room,
                        status,
                        visibility,
                        startedAt,
                        endedAt
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

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
            const broadcast =
                await broadcastModel.findByIdAndDelete(
                    req.params.id
                );

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