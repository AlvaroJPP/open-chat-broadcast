import { Request, Response } from "express";

import mediaModel from "../models/media_model.js";

const mediaController = {
    model: mediaModel,

    async create(req: Request, res: Response) {
        try {
            const {
                user,
                room,
                message,
                type,
                filename,
                mimeType,
                size,
                url,
                width,
                height,
                duration,
                resolution
            } = req.body;

            if (
                !user ||
                !type ||
                !filename ||
                !mimeType ||
                size === undefined ||
                !url
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message:
                            "User, type, filename, mimeType, size e url são obrigatórios."
                    }
                });
            }

            const media =
                await mediaModel.create({
                    user,
                    room: room || null,
                    message: message || null,
                    type,
                    filename,
                    mimeType,
                    size,
                    url,
                    width: width || null,
                    height: height || null,
                    duration: duration || null,
                    resolution: resolution || null
                });

            return res.status(201).json({
                success: true,
                data: media
            });
        } catch (error) {
            console.error(
                "[MEDIA] Erro ao criar mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao criar mídia."
                }
            });
        }
    },

    async findById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const media =
                await mediaModel.findById(id);

            if (!media) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Mídia não encontrada."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: media
            });
        } catch (error) {
            console.error(
                "[MEDIA] Erro ao buscar mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar mídia."
                }
            });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const media =
                await mediaModel.findById(id);

            if (!media) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Mídia não encontrada."
                    }
                });
            }

            await mediaModel.findByIdAndDelete(id);

            return res.status(200).json({
                success: true,
                data: null
            });
        } catch (error) {
            console.error(
                "[MEDIA] Erro ao excluir mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao excluir mídia."
                }
            });
        }
    }
};

export default mediaController;