import { Request, Response } from "express";
import userModel from "../models/user_model.ts";

const userController = {
    model: userModel,

    async create(req: Request, res: Response) {
        try {
            const {
                username,
                nickname,
                avatar
            } = req.body;

            if (!username || !nickname) {
                return res.status(400).json({
                    success: false,
                    error: {
                        status: 400,
                        message: "Username e nickname são obrigatórios."
                    }
                });
            }

            const existingUser =
                await userModel.findOne({
                    username: username.toLowerCase()
                });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        status: 409,
                        message: "Username já está em uso."
                    }
                });
            }

            const user = await userModel.create({
                username,
                nickname,
                avatar
            });

            return res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error(
                "[USER] Erro ao criar usuário:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao criar usuário."
                }
            });
        }
    },

    async findAll(req: Request, res: Response) {
        try {
            const users = await userModel.find();

            return res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error(
                "[USER] Erro ao buscar usuários:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar usuários."
                }
            });
        }
    },

    async findById(req: Request, res: Response) {
        try {
            const user =
                await userModel.findById(
                    req.params.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Usuário não encontrado."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error(
                "[USER] Erro ao buscar usuário:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao buscar usuário."
                }
            });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const {
                nickname,
                avatar,
                status
            } = req.body;

            const user =
                await userModel.findByIdAndUpdate(
                    req.params.id,
                    {
                        nickname,
                        avatar,
                        status
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Usuário não encontrado."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error(
                "[USER] Erro ao atualizar usuário:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao atualizar usuário."
                }
            });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const user =
                await userModel.findByIdAndDelete(
                    req.params.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        status: 404,
                        message: "Usuário não encontrado."
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: null
            });
        } catch (error) {
            console.error(
                "[USER] Erro ao excluir usuário:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    status: 500,
                    message: "Erro ao excluir usuário."
                }
            });
        }
    }
};

export default userController;