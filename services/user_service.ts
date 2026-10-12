import mongoose from "mongoose";

import userModel from "../models/user_model.ts";

/**
 * ============================================================
 * APP ERROR
 * ============================================================
 */

export class AppError extends Error {
    status: number;

    constructor(
        message: string,
        status = 400
    ) {
        super(message);

        this.name = "AppError";
        this.status = status;

        Object.setPrototypeOf(
            this,
            AppError.prototype
        );
    }
}

/**
 * ============================================================
 * TIPOS
 * ============================================================
 */

type CreateUserInput = {
    email: string;
    nickname: string;
    pwd: string;
    avatar?: string;
};

type UpdateUserInput = {
    nickname?: string;
    avatar?: string;
    status?: string;
};

/**
 * ============================================================
 * ERROS
 * ============================================================
 */

function toAppError(
    error: unknown
): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (
        error instanceof
        mongoose.Error.CastError
    ) {
        return new AppError(
            "Identificador inválido.",
            400
        );
    }

    if (error instanceof Error) {
        if (
            error.name ===
            "ValidationError"
        ) {
            return new AppError(
                error.message,
                400
            );
        }

        /**
         * DuplicateKeyError
         *
         * Dependendo da versão do Mongoose,
         * erros de índice único podem chegar como
         * MongoServerError com code 11000.
         */
        if (
            error.name ===
            "DuplicateKeyError"
        ) {
            return new AppError(
                error.message,
                409
            );
        }

        const mongoError =
            error as Error & {
                code?: number;
            };

        if (mongoError.code === 11000) {
            return new AppError(
                "E-mail ou apelido já cadastrado.",
                409
            );
        }
    }

    console.error(
        "[USER_SERVICE] Erro inesperado:",
        error
    );

    return new AppError(
        "Erro interno ao processar usuário.",
        500
    );
}

/**
 * ============================================================
 * CRIAR USUÁRIO
 * ============================================================
 */

export async function createUser(
    input: CreateUserInput
) {
    try {
        if (
            !input.email ||
            !input.nickname ||
            !input.pwd
        ) {
            throw new AppError(
                "Email, apelido e senha são obrigatórios.",
                400
            );
        }

        const userData: {
            email: string;
            nickname: string;
            pwd: string;
            avatar?: string | null;
        } = {
            email: input.email,
            nickname: input.nickname.trim().toLowerCase(),
            pwd: input.pwd,
        };

        if (input.avatar !== undefined) {
            userData.avatar = input.avatar;
        }

        const user = await userModel.create(userData);

        console.log(
            `[USER_SERVICE] Usuário criado: ${user.nickname}`
        );

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * ============================================================
 * LISTAR USUÁRIOS
 * ============================================================
 */

export async function findAllUsers() {
    try {
        return await userModel.find();
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * ============================================================
 * BUSCAR USUÁRIO POR ID
 * ============================================================
 */

export async function findUserById(
    id: string
) {
    try {
        const user =
            await userModel.findById(id);

        if (!user) {
            throw new AppError(
                "Usuário não encontrado.",
                404
            );
        }

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * ============================================================
 * ATUALIZAR USUÁRIO
 * ============================================================
 */

export async function updateUser(
    id: string,
    input: UpdateUserInput
) {
    try {
        const update: UpdateUserInput = {};

        if (
            input.nickname !== undefined
        ) {
            update.nickname =
                input.nickname
                    .trim()
                    .toLowerCase();
        }

        if (
            input.avatar !== undefined
        ) {
            update.avatar =
                input.avatar;
        }

        if (
            input.status !== undefined
        ) {
            update.status =
                input.status;
        }

        const user =
            await userModel.findByIdAndUpdate(
                id,
                update,
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!user) {
            throw new AppError(
                "Usuário não encontrado.",
                404
            );
        }

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * ============================================================
 * EXCLUIR USUÁRIO
 * ============================================================
 */

export async function deleteUser(
    id: string
) {
    try {
        const user =
            await userModel.findByIdAndDelete(
                id
            );

        if (!user) {
            throw new AppError(
                "Usuário não encontrado.",
                404
            );
        }

        console.log(
            `[USER_SERVICE] Usuário removido: ${id}`
        );
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * ============================================================
 * AUTENTICAR USUÁRIO
 * ============================================================
 */

export async function authenticateUser(
    nickname: string,
    pwd: string
) {
    try {
        console.log(
            "[AUTH] Iniciando autenticação..."
        );

        /**
         * Validação dos dados recebidos.
         */
        if (!nickname || !pwd) {
            console.error(
                "[AUTH] Nickname ou senha não informados."
            );

            throw new AppError(
                "Apelido e senha são obrigatórios.",
                400
            );
        }

        /**
         * Normaliza o nickname.
         */
        const normalizedNickname =
            nickname
                .trim()
                .toLowerCase();

        console.log(
            "[AUTH] Nickname recebido:",
            nickname
        );

        console.log(
            "[AUTH] Nickname pesquisado:",
            normalizedNickname
        );

        /**
         * O campo pwd possui select:false.
         *
         * Por isso precisamos usar:
         *
         * .select("+pwd")
         */
        const user =
            await userModel
                .findOne({
                    nickname:
                        normalizedNickname,
                })
                .select("+pwd");

        /**
         * Verifica se o usuário existe.
         */
        console.log(
            "[AUTH] Usuário encontrado:",
            Boolean(user)
        );

        if (!user) {
            console.error(
                "[AUTH] Nenhum usuário encontrado com esse nickname."
            );

            throw new AppError(
                "Apelido ou senha inválidos.",
                401
            );
        }

        /**
         * Informações de diagnóstico.
         *
         * NÃO exibimos a senha.
         */
        console.log(
            "[AUTH] ID do usuário:",
            user._id.toString()
        );

        console.log(
            "[AUTH] Nickname no banco:",
            user.nickname
        );

        console.log(
            "[AUTH] Hash da senha existe:",
            Boolean(user.pwd)
        );

        /**
         * Segurança adicional.
         */
        if (!user.pwd) {
            console.error(
                "[AUTH] O hash da senha não foi retornado."
            );

            throw new AppError(
                "Erro ao verificar a senha do usuário.",
                500
            );
        }

        /**
         * Compara a senha informada
         * com o hash armazenado.
         */
        const isValid =
            await user.comparePassword(
                pwd
            );

        console.log(
            "[AUTH] Senha válida:",
            isValid
        );

        if (!isValid) {
            console.error(
                "[AUTH] A senha informada não corresponde ao usuário."
            );

            throw new AppError(
                "Apelido ou senha inválidos.",
                401
            );
        }

        console.log(
            `[AUTH] Usuário autenticado: ${user.nickname}`
        );

        /**
         * Nunca devolver o hash da senha.
         */
        user.pwd =
            undefined as unknown as string;

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}