import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true, // Email é obrigatório
            unique: true, // Não permite dois usuários com o mesmo email
            trim: true, // Remove espaços no início e no final
            lowercase: true, // Salva o email sempre em letras minúsculas
            minlength: 4, // Mínimo de 4 caracteres
            maxlength: 60, // Máximo de 30 caracteres
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Valida o formato do email
        },

        nickname: {
            type: String,
            required: true, // Apelido público é obrigatório
            trim: true, // Remove espaços no início e no final
            minlength: 1, // Mínimo de 1 caractere
            maxlength: 50 // Máximo de 50 caracteres
        },

        avatar: {
            type: String,
            default: null // URL da imagem de perfil; começa vazio
        },

        status: {
            type: String,
            enum: [
                "online", // Usuário está online
                "offline", // Usuário está offline
                "away", // Usuário está ausente
                "busy" // Usuário está ocupado
            ],
            default: "offline" // Todo novo usuário começa offline
        }
    },
    {
        timestamps: true, // Cria automaticamente createdAt e updatedAt
        collection: "users" // Nome da coleção no MongoDB
    }
);

const userModel =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

export default userModel;