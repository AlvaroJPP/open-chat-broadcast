import mongoose, {
    Document,
    Model,
    Schema,
} from "mongoose";

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Status possíveis do usuário.
 */
export type UserStatus =
    | "online"
    | "offline"
    | "away"
    | "busy";

/**
 * Dados armazenados no usuário.
 */
export interface IUser {
    email: string;
    nickname: string;
    avatar?: string | null;
    pwd: string;
    isMaster: boolean;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Métodos disponíveis no documento do usuário.
 */
export interface IUserMethods {
    comparePassword(
        candidatePassword: string
    ): Promise<boolean>;
}

/**
 * Documento completo do Mongoose.
 */
export type UserDocument =
    Document &
    IUser &
    IUserMethods;

/**
 * Modelo do usuário.
 */
export type UserModel =
    Model<IUser, {}, IUserMethods>;

/**
 * Schema do usuário.
 */
const userSchema = new Schema<
    IUser,
    UserModel,
    IUserMethods
>(
    {
        email: {
            type: String,
            required: [
                true,
                "O e-mail é obrigatório.",
            ],
            trim: true,
            lowercase: true,
            minlength: [
                4,
                "O e-mail deve ter no mínimo 4 caracteres.",
            ],
            maxlength: [
                60,
                "O e-mail deve ter no máximo 60 caracteres.",
            ],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Informe um e-mail em um formato válido.",
            ],
        },

        nickname: {
            type: String,
            required: [
                true,
                "O apelido é obrigatório.",
            ],
            trim: true,
            minlength: [
                3,
                "O apelido deve ter no mínimo 3 caracteres.",
            ],
            maxlength: [
                50,
                "O apelido deve ter no máximo 50 caracteres.",
            ],
            match: [
                /^[a-zA-Z0-9_.]+$/,
                "O apelido só pode conter letras, números, ponto e underline.",
            ],
        },

        avatar: {
            type: String,
            default: null,
            trim: true,
        },

        pwd: {
            type: String,
            required: [
                true,
                "A senha é obrigatória.",
            ],
            minlength: [
                6,
                "A senha deve ter no mínimo 6 caracteres.",
            ],
            maxlength: [
                40,
                "A senha deve ter no máximo 40 caracteres.",
            ],
            select: false,
        },

        isMaster: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: {
                values: [
                    "online",
                    "offline",
                    "away",
                    "busy",
                ],
                message:
                    "Status inválido. Use: online, offline, away ou busy.",
            },
            default: "offline",
        },
    },
    {
        timestamps: true,
        collection: "users",
    }
);

/**
 * ============================================================
 * ÍNDICES
 * ============================================================
 */

userSchema.index(
    { email: 1 },
    { unique: true }
);

userSchema.index(
    { nickname: 1 },
    { unique: true }
);

/**
 * ============================================================
 * HASH DA SENHA
 * ============================================================
 *
 * O hash acontece somente quando:
 *
 * - o usuário é criado; ou
 * - pwd foi alterado.
 */
userSchema.pre("save", async function () {
    if (!this.isModified("pwd")) {
        return;
    }

    this.pwd = await bcrypt.hash(
        this.pwd,
        SALT_ROUNDS
    );
});

/**
 * ============================================================
 * MÉTODOS
 * ============================================================
 */

/**
 * Compara uma senha em texto com o hash armazenado.
 */
userSchema.method(
    "comparePassword",
    async function (
        this: UserDocument,
        candidatePassword: string
    ): Promise<boolean> {
        return bcrypt.compare(
            candidatePassword,
            this.pwd
        );
    }
);

/**
 * ============================================================
 * MODEL
 * ============================================================
 *
 * O cast explícito evita que o TypeScript interprete
 * mongoose.models.User como uma união incompatível.
 */
const userModel =
    (mongoose.models["User"] as UserModel | undefined) ??
    mongoose.model<IUser, UserModel>(
        "User",
        userSchema
    );

export default userModel;