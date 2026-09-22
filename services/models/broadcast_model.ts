import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true, // Título da transmissão é obrigatório
            trim: true, // Remove espaços extras
            minlength: 1, // Mínimo de 1 caractere
            maxlength: 100 // Máximo de 100 caracteres
        },

        description: {
            type: String,
            default: "", // Caso não seja informada, começa vazia
            trim: true, // Remove espaços extras
            maxlength: 1000 // Limite de 1000 caracteres
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // Toda transmissão precisa ter um proprietário
            index: true // Cria índice para pesquisas pelo proprietário
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null // Sala associada à transmissão; pode começar vazia
        },

        status: {
            type: String,
            enum: [
                "scheduled", // Transmissão agendada
                "live", // Transmissão acontecendo agora
                "ended", // Transmissão encerrada
                "cancelled" // Transmissão cancelada
            ],
            default: "scheduled", // Nova transmissão começa como agendada
            index: true // Facilita pesquisas por status
        },

        visibility: {
            type: String,
            enum: [
                "public", // Qualquer pessoa pode acessar
                "private" // Acesso restrito
            ],
            default: "public" // Por padrão, a transmissão é pública
        },

        startedAt: {
            type: Date,
            default: null // Data e hora em que a transmissão começou
        },

        endedAt: {
            type: Date,
            default: null // Data e hora em que a transmissão terminou
        }
    },
    {
        timestamps: true, // Cria createdAt e updatedAt automaticamente
        collection: "broadcasts" // Nome da coleção no MongoDB
    }
);

const broadcastModel =
    mongoose.models.Broadcast ||
    mongoose.model("Broadcast", broadcastSchema);

export default broadcastModel;