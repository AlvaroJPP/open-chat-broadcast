import mongoose from "mongoose";
import userModel from "../models/user_model.ts";

/**
 * Erro de aplicação com status HTTP definido.
 * Usado para o controller saber qual status devolver sem precisar
 * inspecionar o tipo/mensagem do erro do Mongoose.
 */
export class AppError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "AppError";
        this.status = status;
    }
}

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
 * Converte erros do Mongoose/MongoDB (já parcialmente tratados nos hooks
 * do model, ex: ValidationError e E11000) em AppError com status HTTP correto.
 * Assim o controller não precisa conhecer detalhes de Mongoose.
 */
function toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof mongoose.Error.CastError) {
        return new AppError("Identificador inválido.", 400);
    }

    if (error instanceof Error) {
        // Mensagens já formatadas nos hooks post("save") do model
        if (error.name === "ValidationError") {
            return new AppError(error.message, 400);
        }

        if (error.name === "DuplicateKeyError") {
            return new AppError(error.message, 409);
        }
    }

    console.error("[USER_SERVICE] Erro inesperado:", error);
    return new AppError("Erro interno ao processar usuário.", 500);
}

/** Cria um novo usuário. Validações de formato ficam a cargo do Mongoose. */
export async function createUser(input: CreateUserInput) {
    try {
        if (!input.email || !input.nickname || !input.pwd) {
            throw new AppError("Email, apelido e senha são obrigatórios.", 400);
        }

        const user = await userModel.create({
            email: input.email,
            nickname: input.nickname,
            avatar: input.avatar,
            pwd: input.pwd,
        });

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/** Retorna todos os usuários cadastrados. */
export async function findAllUsers() {
    try {
        return await userModel.find();
    } catch (error) {
        throw toAppError(error);
    }
}

/** Busca um usuário pelo ID. Lança 404 se não existir. */
export async function findUserById(id: string) {
    try {
        const user = await userModel.findById(id);

        if (!user) {
            throw new AppError("Usuário não encontrado.", 404);
        }

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/** Atualiza dados de um usuário existente. */
export async function updateUser(id: string, input: UpdateUserInput) {
    try {
        const user = await userModel.findByIdAndUpdate(
            id,
            {
                nickname: input.nickname,
                avatar: input.avatar,
                status: input.status,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!user) {
            throw new AppError("Usuário não encontrado.", 404);
        }

        return user;
    } catch (error) {
        throw toAppError(error);
    }
}

/** Remove um usuário pelo ID. */
export async function deleteUser(id: string) {
    try {
        const user = await userModel.findByIdAndDelete(id);

        if (!user) {
            throw new AppError("Usuário não encontrado.", 404);
        }
    } catch (error) {
        throw toAppError(error);
    }
}

/**
 * Autentica um usuário pelo nickname + senha.
 * Retorna o usuário (sem o campo `pwd`) se as credenciais forem válidas.
 */
export async function authenticateUser(nickname: string, pwd: string) {
    try {
        if (!nickname || !pwd) {
            console.error("nickname", nickname, "pwd", pwd)
            throw new AppError("Apelido e senha são obrigatórios.", 400);
        }

        // select: false no schema exige +pwd explícito para comparar
        const user = await userModel
            .findOne({ nickname: nickname.toLowerCase().trim() })
            .select("+pwd");

        if (!user) {
            throw new AppError("Apelido ou senha inválidos.", 401);
        }

        const isValid = await user.comparePassword(pwd);

        if (!isValid) {
            throw new AppError("Apelido ou senha inválidos.", 401);
        }

        user.pwd = undefined as unknown as string; // não vazar o hash na resposta
        return user;
    } catch (error) {
        throw toAppError(error);
    }
}