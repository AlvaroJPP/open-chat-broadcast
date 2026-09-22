import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true, // Username é obrigatório
            unique: true, // Não permite dois usuários com o mesmo username
            trim: true, // Remove espaços no início e no final
            lowercase: true, // Salva o username sempre em letras minúsculas
            minlength: 3, // Mínimo de 3 caracteres
            maxlength: 30, // Máximo de 30 caracteres
            match: /^[a-zA-Z0-9_]+$/ // Permite apenas letras, números e _
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