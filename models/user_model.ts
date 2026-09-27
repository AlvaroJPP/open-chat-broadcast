import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "O e-mail é obrigatório."],
            trim: true,
            lowercase: true,
            minlength: [4, "O e-mail deve ter no mínimo 4 caracteres."],
            maxlength: [60, "O e-mail deve ter no máximo 60 caracteres."],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Informe um e-mail em um formato válido.",
            ],
            // unique fica só no índice abaixo (schema.index), evita warning de duplicidade
        },

        nickname: {
            type: String,
            required: [true, "O apelido é obrigatório."],
            trim: true,
            minlength: [3, "O apelido deve ter no mínimo 3 caracteres."],
            maxlength: [50, "O apelido deve ter no máximo 50 caracteres."],
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
            required: [true, "A senha é obrigatória."],
            minlength: [6, "A senha deve ter no mínimo 6 caracteres."],
            maxlength: [40, "A senha deve ter no máximo 40 caracteres."],
            select: false,
        },

        isMaster: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: {
                values: ["online", "offline", "away", "busy"],
                message: "Status inválido. Use: online, offline, away ou busy.",
            },
            default: "offline",
        },
    },
    {
        timestamps: true,
        collection: "users",
    }
);

// ============================================================
// ÍNDICES (única fonte de unicidade — não duplicar com `unique: true` acima)
// ============================================================
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nickname: 1 }, { unique: true });

// ============================================================
// HOOKS
// ============================================================

/**
 * Faz o hash da senha antes de salvar, apenas se ela foi criada/alterada.
 * Sem isso, a senha é salva em texto puro no banco.
 * Mongoose 7+: hooks assíncronos não recebem `next` — basta retornar
 * normalmente (sucesso) ou lançar o erro (que o Mongoose captura sozinho).
 */
userSchema.pre("save", async function () {
    if (!this.isModified("pwd")) {
        return;
    }

    this.pwd = await bcrypt.hash(this.pwd, SALT_ROUNDS);
});

// A tradução de erros (ValidationError, E11000) é feita inteiramente
// em `user_service.ts` (função toAppError) — nenhum post-hook de erro aqui.

// ============================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================

userSchema.methods.comparePassword = function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.pwd);
};

const userModel =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

export default userModel;