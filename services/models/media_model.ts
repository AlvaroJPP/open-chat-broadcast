import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // Usuário responsável pelo arquivo
            index: true // Facilita buscar arquivos de um usuário
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null, // Sala onde o arquivo foi utilizado
            index: true // Facilita buscar arquivos de uma sala
        },

        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null // Mensagem associada ao arquivo
        },

        type: {
            type: String,
            enum: [
                "image", // Imagem
                "video", // Vídeo
                "audio", // Áudio
                "document", // Documento
                "archive" // Arquivo compactado
            ],
            required: true, // Tipo do arquivo é obrigatório
            index: true // Facilita pesquisas por tipo de mídia
        },

        filename: {
            type: String,
            required: true, // Nome do arquivo é obrigatório
            trim: true, // Remove espaços extras
            maxlength: 255 // Limite do nome do arquivo
        },

        mimeType: {
            type: String,
            required: true, // Tipo MIME do arquivo
            trim: true
        },

        size: {
            type: Number,
            required: true, // Tamanho do arquivo em bytes
            min: 0 // O tamanho não pode ser negativo
        },

        url: {
            type: String,
            required: true, // Endereço usado para acessar o arquivo
            trim: true
        },

        width: {
            type: Number,
            default: null, // Largura da mídia em pixels
            min: 1
        },

        height: {
            type: Number,
            default: null, // Altura da mídia em pixels
            min: 1
        },

        duration: {
            type: Number,
            default: null, // Duração do áudio/vídeo em segundos
            min: 0
        },

        resolution: {
            type: String,
            enum: [
                "360p", // 640x360
                "720p", // 1280x720
                "1080p", // 1920x1080
                "1440p", // 2560x1440
                "2160p" // 3840x2160
            ],
            default: null // Resolução pode não existir para imagens/documentos
        }
    },
    {
        timestamps: true, // Cria createdAt e updatedAt automaticamente
        collection: "media" // Nome da coleção no MongoDB
    }
);

const mediaModel =
    mongoose.models.Media ||
    mongoose.model("Media", mediaSchema);

export default mediaModel;