import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true, // Toda mensagem pertence a uma sala
            index: true // Facilita buscar mensagens de uma sala
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // Toda mensagem precisa identificar quem enviou
            index: true // Facilita buscar mensagens de um usuário
        },

        content: {
            type: String,
            default: "", // Pode ficar vazio quando a mensagem possui apenas mídia
            trim: true, // Remove espaços extras
            maxlength: 5000 // Limite de 5000 caracteres
        },

        type: {
            type: String,
            enum: [
                "text", // Mensagem de texto
                "image", // Mensagem contendo imagem
                "video", // Mensagem contendo vídeo
                "audio", // Mensagem contendo áudio
                "document", // Mensagem contendo documento
                "system" // Mensagem automática do sistema
            ],
            default: "text", // Mensagens comuns são de texto
            index: true // Facilita pesquisas por tipo
        },

        media: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
            default: null // Arquivo de mídia associado à mensagem
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null // Mensagem que está sendo respondida
        }
    },
    {
        timestamps: true, // Cria createdAt e updatedAt automaticamente
        collection: "messages" // Nome da coleção no MongoDB
    }
);

const messageModel =
    mongoose.models.Message ||
    mongoose.model("Message", messageSchema);

export default messageModel;