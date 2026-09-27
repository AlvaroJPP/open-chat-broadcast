import { Request, Response } from "express";
import {
    createUser,
    findAllUsers,
    findUserById,
    updateUser,
    deleteUser,
    AppError,
} from "../services/user_service.ts";

const TAG = "[USER]";

/** Extrai status + mensagem de um erro (AppError ou não) para a resposta HTTP. */
function respondWithError(res: Response, error: unknown, fallbackMessage: string) {
    const status = error instanceof AppError ? error.status : 500;
    const message = error instanceof AppError ? error.message : fallbackMessage;

    return res.status(status).json({
        success: false,
        error: { status, message },
    });
}

const userController = {
    async create(req: Request, res: Response) {
        console.log(TAG, "Criando usuário...");
        try {
            const { email, nickname, avatar, pwd } = req.body;

            const user = await createUser({ email, nickname, avatar, pwd });

            return res.status(201).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error(TAG, "Erro ao criar usuário:", error);
            return respondWithError(res, error, "Erro ao criar usuário.");
        }
    },

    async findAll(_req: Request, res: Response) {
        try {
            const users = await findAllUsers();

            return res.status(200).json({
                success: true,
                data: users,
            });
        } catch (error) {
            console.error(TAG, "Erro ao buscar usuários:", error);
            return respondWithError(res, error, "Erro ao buscar usuários.");
        }
    },

    async findById(req: Request, res: Response) {
        try {
            if (Array.isArray(req.params.id)) req.params.id = req.params.id[0];
            const user = await findUserById(req.params.id);

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error(TAG, "Erro ao buscar usuário:", error);
            return respondWithError(res, error, "Erro ao buscar usuário.");
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { nickname, avatar, status } = req.body;

            if (Array.isArray(req.params.id)) req.params.id = req.params.id[0];
            const user = await updateUser(req.params.id, { nickname, avatar, status });

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error(TAG, "Erro ao atualizar usuário:", error);
            return respondWithError(res, error, "Erro ao atualizar usuário.");
        }
    },

    async delete(req: Request, res: Response) {
        try {
            if (Array.isArray(req.params.id)) req.params.id = req.params.id[0];
            await deleteUser(req.params.id);

            return res.status(200).json({
                success: true,
                data: null,
            });
        } catch (error) {
            console.error(TAG, "Erro ao excluir usuário:", error);
            return respondWithError(res, error, "Erro ao excluir usuário.");
        }
    },
};

export default userController;