import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true, // Nome da sala
            trim: true, // Remove espaços extras
            minlength: 1, // Mínimo de 1 caractere
            maxlength: 100 // Máximo de 100 caracteres
        },

        broadcast: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Broadcast",
            default: null, // Broadcast associado à sala
            index: true // Facilita pesquisas pelo broadcast
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // Usuário que atualmente administra a sala
            index: true // Facilita encontrar salas administradas pelo usuário
        },

        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true // Usuário participante da sala
                },

                joinedAt: {
                    type: Date,
                    default: Date.now // Data e hora em que entrou na sala
                }
            }
        ],

        maxParticipants: {
            type: Number,
            default: 100, // Número máximo de participantes
            min: 1 // Deve permitir pelo menos um participante
        },

        status: {
            type: String,
            enum: [
                "waiting", // Sala aguardando participantes
                "active", // Sala ativa
                "closed" // Sala encerrada
            ],
            default: "waiting", // Nova sala começa aguardando
            index: true // Facilita pesquisas pelo status
        }
    },
    {
        timestamps: true, // Cria createdAt e updatedAt automaticamente
        collection: "rooms" // Nome da coleção no MongoDB
    }
);

const roomModel =
    mongoose.models.Room ||
    mongoose.model("Room", roomSchema);

export default roomModel;