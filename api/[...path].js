// serverless/api-handler.ts
import mongoose8 from "mongoose";

// config/app.ts
import express from "express";
import cors from "cors";

// config/config.ts
import dns from "node:dns";
var PORT = Number(process.env["PORT"]) || 3e3;
var HOST = process.env["HOST"] || "0.0.0.0";
var MONGODB_URI = process.env["MONGODB_URI"] || "mongodb://127.0.0.1:27017/app";
var defaultAllowedOrigins = [
  "https://localhost:5175",
  "http://192.168.1.101:5175"
];
var configuredOrigins = [
  ...process.env["FRONTEND_URL"] ? [process.env["FRONTEND_URL"].trim()] : [],
  ...defaultAllowedOrigins
];
var config = {
  http: {
    port: PORT,
    host: HOST,
    access: {
      allowAll: true,
      allowedIPs: []
    },
    allowedOrigins: process.env["ALLOWED_ORIGINS"] ? process.env["ALLOWED_ORIGINS"].split(",").map((value) => value.trim()).filter(Boolean) : configuredOrigins
  },
  // Mantenha o restante do seu objeto config
  mongodb: {
    uri: MONGODB_URI
  },
  rooms: {
    // true = fecha todas as salas no desligamento
    // false = não executa a limpeza automática
    closeAllOnShutdown: true,
    // Limpa salas que ficaram abertas após uma queda
    closeAllOnStartup: true
  },
  directory: {
    enabled: false
  },
  dns: {
    servers: ["1.1.1.1", "8.8.8.8"],
    configure() {
      dns.setServers(this.servers);
      console.log(`[DNS] DNS configurado: ${this.servers.join(", ")}`);
    }
  }
};
var config_default = config;

// config/http.js
var http = {
  /**
   * Resposta de sucesso
   */
  success(res, data = null, status = 200) {
    return res.status(status).json({
      success: true,
      data
    });
  },
  /**
   * Recurso criado
   */
  created(res, data = null) {
    return res.status(201).json({
      success: true,
      data
    });
  },
  /**
   * Requisição inválida
   */
  badRequest(res, message = "Requisi\xE7\xE3o inv\xE1lida") {
    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        message
      }
    });
  },
  /**
   * Não autenticado
   */
  unauthorized(res, message = "N\xE3o autenticado") {
    return res.status(401).json({
      success: false,
      error: {
        status: 401,
        message
      }
    });
  },
  /**
   * Sem permissão
   */
  forbidden(res, message = "Acesso negado") {
    return res.status(403).json({
      success: false,
      error: {
        status: 403,
        message
      }
    });
  },
  /**
   * Recurso não encontrado
   */
  notFound(res, message = "Recurso n\xE3o encontrado") {
    return res.status(404).json({
      success: false,
      error: {
        status: 404,
        message
      }
    });
  },
  /**
   * Conflito
   */
  conflict(res, message = "Conflito") {
    return res.status(409).json({
      success: false,
      error: {
        status: 409,
        message
      }
    });
  },
  /**
   * Erro interno
   */
  internal(res, message = "Erro interno do servidor") {
    return res.status(500).json({
      success: false,
      error: {
        status: 500,
        message
      }
    });
  },
  /**
   * Trata uma exceção e envia a resposta HTTP.
   */
  error(res, error) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        status,
        message: error.message || "Erro interno do servidor"
      }
    });
  },
  /**
   * Wrapper para rotas assíncronas.
   *
   * Qualquer erro lançado dentro da rota
   * será encaminhado automaticamente.
   */
  asyncHandler(handler2) {
    return async (req, res, next) => {
      try {
        await handler2(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  /**
   * Middleware global de tratamento de erros.
   */
  errorHandler(error, req, res, next) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        status,
        message: error.message || "Erro interno do servidor"
      }
    });
  },
  /**
   * Middleware para rotas inexistentes.
   */
  notFoundHandler(req, res) {
    return res.status(404).json({
      success: false,
      error: {
        status: 404,
        message: `Rota n\xE3o encontrada: ${req.method} ${req.originalUrl}`
      }
    });
  },
  ipFilter(req, res, next) {
    const access = config_default.http.access;
    if (access.allowAll) {
      return next();
    }
    const clientIP = req.ip || req.socket.remoteAddress;
    const normalizedIP = clientIP?.replace(/^::ffff:/, "");
    if (access.allowedIPs.includes(normalizedIP)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: {
        status: 403,
        message: "IP n\xE3o autorizado"
      }
    });
  }
};
var http_default = http;

// services/user_service.ts
import mongoose2 from "mongoose";

// models/user_model.ts
import mongoose, {
  Schema
} from "mongoose";
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
var userSchema = new Schema(
  {
    email: {
      type: String,
      required: [
        true,
        "O e-mail \xE9 obrigat\xF3rio."
      ],
      trim: true,
      lowercase: true,
      minlength: [
        4,
        "O e-mail deve ter no m\xEDnimo 4 caracteres."
      ],
      maxlength: [
        60,
        "O e-mail deve ter no m\xE1ximo 60 caracteres."
      ],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Informe um e-mail em um formato v\xE1lido."
      ]
    },
    nickname: {
      type: String,
      required: [
        true,
        "O apelido \xE9 obrigat\xF3rio."
      ],
      trim: true,
      minlength: [
        3,
        "O apelido deve ter no m\xEDnimo 3 caracteres."
      ],
      maxlength: [
        50,
        "O apelido deve ter no m\xE1ximo 50 caracteres."
      ],
      match: [
        /^[a-zA-Z0-9_.]+$/,
        "O apelido s\xF3 pode conter letras, n\xFAmeros, ponto e underline."
      ]
    },
    avatar: {
      type: String,
      default: null,
      trim: true
    },
    pwd: {
      type: String,
      required: [
        true,
        "A senha \xE9 obrigat\xF3ria."
      ],
      minlength: [
        6,
        "A senha deve ter no m\xEDnimo 6 caracteres."
      ],
      maxlength: [
        40,
        "A senha deve ter no m\xE1ximo 40 caracteres."
      ],
      select: false
    },
    isMaster: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: [
          "online",
          "offline",
          "away",
          "busy"
        ],
        message: "Status inv\xE1lido. Use: online, offline, away ou busy."
      },
      default: "offline"
    }
  },
  {
    timestamps: true,
    collection: "users"
  }
);
userSchema.index(
  { email: 1 },
  { unique: true }
);
userSchema.index(
  { nickname: 1 },
  { unique: true }
);
userSchema.pre("save", async function() {
  if (!this.isModified("pwd")) {
    return;
  }
  this.pwd = await bcrypt.hash(
    this.pwd,
    SALT_ROUNDS
  );
});
userSchema.method(
  "comparePassword",
  async function(candidatePassword) {
    return bcrypt.compare(
      candidatePassword,
      this.pwd
    );
  }
);
var userModel = mongoose.models["User"] ?? mongoose.model(
  "User",
  userSchema
);
var user_model_default = userModel;

// services/user_service.ts
var AppError = class _AppError extends Error {
  status;
  constructor(message, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
    Object.setPrototypeOf(
      this,
      _AppError.prototype
    );
  }
};
function toAppError(error) {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof mongoose2.Error.CastError) {
    return new AppError(
      "Identificador inv\xE1lido.",
      400
    );
  }
  if (error instanceof Error) {
    if (error.name === "ValidationError") {
      return new AppError(
        error.message,
        400
      );
    }
    if (error.name === "DuplicateKeyError") {
      return new AppError(
        error.message,
        409
      );
    }
    const mongoError = error;
    if (mongoError.code === 11e3) {
      return new AppError(
        "E-mail ou apelido j\xE1 cadastrado.",
        409
      );
    }
  }
  console.error(
    "[USER_SERVICE] Erro inesperado:",
    error
  );
  return new AppError(
    "Erro interno ao processar usu\xE1rio.",
    500
  );
}
async function createUser(input) {
  try {
    if (!input.email || !input.nickname || !input.pwd) {
      throw new AppError(
        "Email, apelido e senha s\xE3o obrigat\xF3rios.",
        400
      );
    }
    const userData = {
      email: input.email,
      nickname: input.nickname.trim().toLowerCase(),
      pwd: input.pwd
    };
    if (input.avatar !== void 0) {
      userData.avatar = input.avatar;
    }
    const user = await user_model_default.create(userData);
    console.log(
      `[USER_SERVICE] Usu\xE1rio criado: ${user.nickname}`
    );
    return user;
  } catch (error) {
    throw toAppError(error);
  }
}
async function findAllUsers() {
  try {
    return await user_model_default.find();
  } catch (error) {
    throw toAppError(error);
  }
}
async function findUserById(id) {
  try {
    const user = await user_model_default.findById(id);
    if (!user) {
      throw new AppError(
        "Usu\xE1rio n\xE3o encontrado.",
        404
      );
    }
    return user;
  } catch (error) {
    throw toAppError(error);
  }
}
async function updateUser(id, input) {
  try {
    const update = {};
    if (input.nickname !== void 0) {
      update.nickname = input.nickname.trim().toLowerCase();
    }
    if (input.avatar !== void 0) {
      update.avatar = input.avatar;
    }
    if (input.status !== void 0) {
      update.status = input.status;
    }
    const user = await user_model_default.findByIdAndUpdate(
      id,
      update,
      {
        new: true,
        runValidators: true
      }
    );
    if (!user) {
      throw new AppError(
        "Usu\xE1rio n\xE3o encontrado.",
        404
      );
    }
    return user;
  } catch (error) {
    throw toAppError(error);
  }
}
async function deleteUser(id) {
  try {
    const user = await user_model_default.findByIdAndDelete(
      id
    );
    if (!user) {
      throw new AppError(
        "Usu\xE1rio n\xE3o encontrado.",
        404
      );
    }
    console.log(
      `[USER_SERVICE] Usu\xE1rio removido: ${id}`
    );
  } catch (error) {
    throw toAppError(error);
  }
}
async function authenticateUser(nickname, pwd) {
  try {
    console.log(
      "[AUTH] Iniciando autentica\xE7\xE3o..."
    );
    if (!nickname || !pwd) {
      console.error(
        "[AUTH] Nickname ou senha n\xE3o informados."
      );
      throw new AppError(
        "Apelido e senha s\xE3o obrigat\xF3rios.",
        400
      );
    }
    const normalizedNickname = nickname.trim().toLowerCase();
    console.log(
      "[AUTH] Nickname recebido:",
      nickname
    );
    console.log(
      "[AUTH] Nickname pesquisado:",
      normalizedNickname
    );
    const user = await user_model_default.findOne({
      nickname: normalizedNickname
    }).select("+pwd");
    console.log(
      "[AUTH] Usu\xE1rio encontrado:",
      Boolean(user)
    );
    if (!user) {
      console.error(
        "[AUTH] Nenhum usu\xE1rio encontrado com esse nickname."
      );
      throw new AppError(
        "Apelido ou senha inv\xE1lidos.",
        401
      );
    }
    console.log(
      "[AUTH] ID do usu\xE1rio:",
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
    if (!user.pwd) {
      console.error(
        "[AUTH] O hash da senha n\xE3o foi retornado."
      );
      throw new AppError(
        "Erro ao verificar a senha do usu\xE1rio.",
        500
      );
    }
    const isValid = await user.comparePassword(
      pwd
    );
    console.log(
      "[AUTH] Senha v\xE1lida:",
      isValid
    );
    if (!isValid) {
      console.error(
        "[AUTH] A senha informada n\xE3o corresponde ao usu\xE1rio."
      );
      throw new AppError(
        "Apelido ou senha inv\xE1lidos.",
        401
      );
    }
    console.log(
      `[AUTH] Usu\xE1rio autenticado: ${user.nickname}`
    );
    user.pwd = void 0;
    return user;
  } catch (error) {
    throw toAppError(error);
  }
}

// controllers/user_controller.ts
var TAG = "[USER]";
function respondWithError(res, error, fallbackMessage) {
  const status = error instanceof AppError ? error.status : 500;
  const message = error instanceof AppError ? error.message : fallbackMessage;
  return res.status(status).json({
    success: false,
    error: { status, message }
  });
}
var userController = {
  async create(req, res) {
    console.log(TAG, "Criando usu\xE1rio...");
    try {
      const { email, nickname, avatar, pwd } = req.body;
      const user = await createUser({ email, nickname, avatar, pwd });
      return res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(TAG, "Erro ao criar usu\xE1rio:", error);
      return respondWithError(res, error, "Erro ao criar usu\xE1rio.");
    }
  },
  async findAll(_req, res) {
    try {
      const users = await findAllUsers();
      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error(TAG, "Erro ao buscar usu\xE1rios:", error);
      return respondWithError(res, error, "Erro ao buscar usu\xE1rios.");
    }
  },
  async findById(req, res) {
    try {
      const rawId = req.params["id"];
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { status: 400, message: "ID do usu\xE1rio \xE9 obrigat\xF3rio." }
        });
      }
      const user = await findUserById(id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(TAG, "Erro ao buscar usu\xE1rio:", error);
      return respondWithError(res, error, "Erro ao buscar usu\xE1rio.");
    }
  },
  async update(req, res) {
    try {
      const { nickname, avatar, status } = req.body;
      const rawId = req.params["id"];
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { status: 400, message: "ID do usu\xE1rio \xE9 obrigat\xF3rio." }
        });
      }
      const user = await updateUser(id, { nickname, avatar, status });
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(TAG, "Erro ao atualizar usu\xE1rio:", error);
      return respondWithError(res, error, "Erro ao atualizar usu\xE1rio.");
    }
  },
  async delete(req, res) {
    try {
      const rawId = req.params["id"];
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { status: 400, message: "ID do usu\xE1rio \xE9 obrigat\xF3rio." }
        });
      }
      await deleteUser(id);
      return res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(TAG, "Erro ao excluir usu\xE1rio:", error);
      return respondWithError(res, error, "Erro ao excluir usu\xE1rio.");
    }
  }
};
var user_controller_default = userController;

// controllers/auth_controller.ts
var TAG2 = "[AUTH]";
function respondWithError2(res, error, fallbackMessage) {
  const status = error instanceof AppError ? error.status : 500;
  const message = error instanceof AppError ? error.message : fallbackMessage;
  return res.status(status).json({
    success: false,
    error: { status, message }
  });
}
var authController = {
  async login(req, res) {
    console.log(TAG2, "Autenticando usu\xE1rio...");
    try {
      const { nickname, pwd } = req.body;
      const user = await authenticateUser(nickname, pwd);
      const token = "TOKEN_PLACEHOLDER";
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        maxAge: 1e3 * 60 * 60 * 24 * 7
        // 7 dias
      });
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(TAG2, "Erro ao autenticar usu\xE1rio:", error);
      return respondWithError2(res, error, "Erro ao autenticar usu\xE1rio.");
    }
  },
  async logout(_req, res) {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      data: null
    });
  }
};
var auth_controller_default = authController;

// routers/user_router.ts
import { Router } from "express";
var userRouter = Router();
userRouter.post(
  "/",
  user_controller_default.create
);
userRouter.get(
  "/",
  user_controller_default.findAll
);
userRouter.get(
  "/:id",
  user_controller_default.findById
);
userRouter.patch(
  "/:id",
  user_controller_default.update
);
userRouter.delete(
  "/:id",
  user_controller_default.delete
);
userRouter.post(
  "/login",
  auth_controller_default.login
);
userRouter.post(
  "/logout",
  auth_controller_default.logout
);
var user_router_default = userRouter;

// routers/broadcast_router.ts
import { Router as Router2 } from "express";

// models/broadcast_model.ts
import mongoose3 from "mongoose";
var broadcastSchema = new mongoose3.Schema(
  {
    title: {
      type: String,
      required: true,
      // Título da transmissão é obrigatório
      trim: true,
      // Remove espaços extras
      minlength: 1,
      // Mínimo de 1 caractere
      maxlength: 100
      // Máximo de 100 caracteres
    },
    description: {
      type: String,
      default: "",
      // Caso não seja informada, começa vazia
      trim: true,
      // Remove espaços extras
      maxlength: 1e3
      // Limite de 1000 caracteres
    },
    owner: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Toda transmissão precisa ter um proprietário
      index: true
      // Cria índice para pesquisas pelo proprietário
    },
    room: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "Room",
      default: null
      // Sala associada à transmissão; pode começar vazia
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        // Transmissão agendada
        "live",
        // Transmissão acontecendo agora
        "ended",
        // Transmissão encerrada
        "cancelled"
        // Transmissão cancelada
      ],
      default: "scheduled",
      // Nova transmissão começa como agendada
      index: true
      // Facilita pesquisas por status
    },
    visibility: {
      type: String,
      enum: [
        "public",
        // Qualquer pessoa pode acessar
        "private"
        // Acesso restrito
      ],
      default: "public"
      // Por padrão, a transmissão é pública
    },
    startedAt: {
      type: Date,
      default: null
      // Data e hora em que a transmissão começou
    },
    endedAt: {
      type: Date,
      default: null
      // Data e hora em que a transmissão terminou
    }
  },
  {
    timestamps: true,
    // Cria createdAt e updatedAt automaticamente
    collection: "broadcasts"
    // Nome da coleção no MongoDB
  }
);
var broadcastModel = mongoose3.models["Broadcast"] ?? mongoose3.model("Broadcast", broadcastSchema);
var broadcast_model_default = broadcastModel;

// controllers/broadcast_controller.ts
var broadcastController = {
  model: broadcast_model_default,
  // Criar um broadcast
  async create(req, res) {
    try {
      const {
        title,
        description,
        owner,
        room,
        status,
        visibility,
        startedAt,
        endedAt
      } = req.body;
      if (!title || !owner) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "Title e owner s\xE3o obrigat\xF3rios."
          }
        });
      }
      const broadcast = await broadcast_model_default.create({
        title,
        description,
        owner,
        room,
        status,
        visibility,
        startedAt,
        endedAt
      });
      return res.status(201).json({
        success: true,
        data: broadcast
      });
    } catch (error) {
      console.error(
        "[BROADCAST] Erro ao criar broadcast:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao criar broadcast."
        }
      });
    }
  },
  // Listar todos os broadcasts
  async findAll(req, res) {
    try {
      const broadcasts = await broadcast_model_default.find();
      return res.status(200).json({
        success: true,
        data: broadcasts
      });
    } catch (error) {
      console.error(
        "[BROADCAST] Erro ao buscar broadcasts:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar broadcasts."
        }
      });
    }
  },
  // Buscar broadcast pelo ID
  async findById(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID do broadcast \xE9 obrigat\xF3rio."
          }
        });
      }
      const broadcast = await broadcast_model_default.findById(id);
      if (!broadcast) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Broadcast n\xE3o encontrado."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: broadcast
      });
    } catch (error) {
      console.error(
        "[BROADCAST] Erro ao buscar broadcast:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar broadcast."
        }
      });
    }
  },
  // Atualizar broadcast
  async update(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID do broadcast \xE9 obrigat\xF3rio."
          }
        });
      }
      const {
        title,
        description,
        room,
        status,
        visibility,
        startedAt,
        endedAt
      } = req.body;
      const broadcast = await broadcast_model_default.findByIdAndUpdate(
        id,
        {
          title,
          description,
          room,
          status,
          visibility,
          startedAt,
          endedAt
        },
        {
          new: true,
          runValidators: true
        }
      );
      if (!broadcast) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Broadcast n\xE3o encontrado."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: broadcast
      });
    } catch (error) {
      console.error(
        "[BROADCAST] Erro ao atualizar broadcast:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao atualizar broadcast."
        }
      });
    }
  },
  // Excluir broadcast
  async delete(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID do broadcast \xE9 obrigat\xF3rio."
          }
        });
      }
      const broadcast = await broadcast_model_default.findByIdAndDelete(id);
      if (!broadcast) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Broadcast n\xE3o encontrado."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(
        "[BROADCAST] Erro ao excluir broadcast:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao excluir broadcast."
        }
      });
    }
  }
};
var broadcast_controller_default = broadcastController;

// routers/broadcast_router.ts
var broadcastRouter = Router2();
broadcastRouter.post(
  "/",
  broadcast_controller_default.create
);
broadcastRouter.get(
  "/",
  broadcast_controller_default.findAll
);
broadcastRouter.get(
  "/:id",
  broadcast_controller_default.findById
);
broadcastRouter.patch(
  "/:id",
  broadcast_controller_default.update
);
broadcastRouter.delete(
  "/:id",
  broadcast_controller_default.delete
);
var broadcast_router_default = broadcastRouter;

// routers/room_router.ts
import { Router as Router3 } from "express";

// models/room_model.ts
import mongoose4 from "mongoose";
var roomSchema = new mongoose4.Schema(
  {
    name: {
      type: String,
      required: true,
      // Nome da sala
      trim: true,
      // Remove espaços extras
      minlength: 1,
      // Mínimo de 1 caractere
      maxlength: 100
      // Máximo de 100 caracteres
    },
    broadcast: {
      type: mongoose4.Schema.Types.ObjectId,
      ref: "Broadcast",
      default: null,
      // Broadcast associado à sala
      index: true
      // Facilita pesquisas pelo broadcast
    },
    owner: {
      type: mongoose4.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Usuário que atualmente administra a sala
      index: true
      // Facilita encontrar salas administradas pelo usuário
    },
    participants: [
      {
        user: {
          type: mongoose4.Schema.Types.ObjectId,
          ref: "User",
          required: true
          // Usuário participante da sala
        },
        joinedAt: {
          type: Date,
          default: Date.now
          // Data e hora em que entrou na sala
        }
      }
    ],
    maxParticipants: {
      type: Number,
      default: 100,
      // Número máximo de participantes
      min: 1
      // Deve permitir pelo menos um participante
    },
    status: {
      type: String,
      enum: [
        "waiting",
        // Sala aguardando participantes
        "active",
        // Sala ativa
        "closed"
        // Sala encerrada
      ],
      default: "waiting",
      // Nova sala começa aguardando
      index: true
      // Facilita pesquisas pelo status
    }
  },
  {
    timestamps: true,
    // Cria createdAt e updatedAt automaticamente
    collection: "rooms"
    // Nome da coleção no MongoDB
  }
);
var roomModel = mongoose4.models["Room"] ?? mongoose4.model("Room", roomSchema);
var room_model_default = roomModel;

// controllers/room_controller.ts
var roomController = {
  model: room_model_default,
  // Criar uma sala
  async create(req, res) {
    try {
      const {
        name,
        owner,
        broadcast,
        maxParticipants
      } = req.body;
      if (!name || !owner) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "Name e owner s\xE3o obrigat\xF3rios."
          }
        });
      }
      const room = await room_model_default.create({
        name,
        owner,
        broadcast: broadcast || null,
        maxParticipants: maxParticipants || 100,
        // Quem cria a sala já entra como participante
        participants: [
          {
            user: owner,
            joinedAt: /* @__PURE__ */ new Date()
          }
        ],
        status: "waiting"
      });
      return res.status(201).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao criar sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao criar sala."
        }
      });
    }
  },
  // Listar todas as salas
  async findAll(req, res) {
    try {
      const rooms = await room_model_default.find();
      return res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao buscar salas:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar salas."
        }
      });
    }
  },
  // Buscar sala pelo ID
  async findById(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findById(id).populate("owner").populate("participants.user");
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao buscar sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar sala."
        }
      });
    }
  },
  // Entrar em uma sala
  async join(req, res) {
    try {
      const {
        user
      } = req.body;
      const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "User \xE9 obrigat\xF3rio."
          }
        });
      }
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      if (room.status === "closed") {
        return res.status(409).json({
          success: false,
          error: {
            status: 409,
            message: "A sala est\xE1 fechada."
          }
        });
      }
      const alreadyParticipant = room.participants.some(
        (participant) => participant.user.toString() === user
      );
      if (alreadyParticipant) {
        return res.status(409).json({
          success: false,
          error: {
            status: 409,
            message: "Usu\xE1rio j\xE1 est\xE1 na sala."
          }
        });
      }
      if (room.participants.length >= room.maxParticipants) {
        return res.status(409).json({
          success: false,
          error: {
            status: 409,
            message: "A sala atingiu o limite de participantes."
          }
        });
      }
      room.participants.push({
        user,
        joinedAt: /* @__PURE__ */ new Date()
      });
      room.status = "active";
      await room.save();
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao entrar na sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao entrar na sala."
        }
      });
    }
  },
  // Sair de uma sala
  async leave(req, res) {
    try {
      const {
        user
      } = req.body;
      const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "User \xE9 obrigat\xF3rio."
          }
        });
      }
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      const participantIndex = room.participants.findIndex(
        (participant) => participant.user.toString() === user
      );
      if (participantIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Usu\xE1rio n\xE3o est\xE1 na sala."
          }
        });
      }
      const wasOwner = room.owner.toString() === user;
      room.participants.splice(
        participantIndex,
        1
      );
      if (wasOwner) {
        if (room.participants.length === 0) {
          room.status = "closed";
        } else {
          const oldestParticipant = [...room.participants].sort(
            (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
          )[0];
          room.owner = oldestParticipant.user;
          room.status = "active";
        }
      } else if (room.participants.length === 0) {
        room.status = "closed";
      }
      await room.save();
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao sair da sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao sair da sala."
        }
      });
    }
  },
  // Atualizar sala
  async update(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const {
        name,
        broadcast,
        maxParticipants,
        status
      } = req.body;
      const room = await room_model_default.findByIdAndUpdate(
        id,
        {
          name,
          broadcast,
          maxParticipants,
          status
        },
        {
          new: true,
          runValidators: true
        }
      );
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao atualizar sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao atualizar sala."
        }
      });
    }
  },
  // Excluir sala
  async delete(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findByIdAndDelete(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(
        "[ROOM] Erro ao excluir sala:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao excluir sala."
        }
      });
    }
  }
};
var room_controller_default = roomController;

// routers/room_router.ts
var roomRouter = Router3();
roomRouter.post(
  "/",
  room_controller_default.create
);
roomRouter.get(
  "/",
  room_controller_default.findAll
);
roomRouter.get(
  "/:id",
  room_controller_default.findById
);
roomRouter.post(
  "/:id/join",
  room_controller_default.join
);
roomRouter.post(
  "/:id/leave",
  room_controller_default.leave
);
roomRouter.patch(
  "/:id",
  room_controller_default.update
);
roomRouter.delete(
  "/:id",
  room_controller_default.delete
);
var room_router_default = roomRouter;

// routers/message_router.ts
import { Router as Router4 } from "express";

// models/message_model.ts
import mongoose5 from "mongoose";
var messageSchema = new mongoose5.Schema(
  {
    room: {
      type: mongoose5.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      // Toda mensagem pertence a uma sala
      index: true
      // Facilita buscar mensagens de uma sala
    },
    user: {
      type: mongoose5.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Toda mensagem precisa identificar quem enviou
      index: true
      // Facilita buscar mensagens de um usuário
    },
    content: {
      type: String,
      default: "",
      // Pode ficar vazio quando a mensagem possui apenas mídia
      trim: true,
      // Remove espaços extras
      maxlength: 5e3
      // Limite de 5000 caracteres
    },
    type: {
      type: String,
      enum: [
        "text",
        // Mensagem de texto
        "image",
        // Mensagem contendo imagem
        "video",
        // Mensagem contendo vídeo
        "audio",
        // Mensagem contendo áudio
        "document",
        // Mensagem contendo documento
        "system"
        // Mensagem automática do sistema
      ],
      default: "text",
      // Mensagens comuns são de texto
      index: true
      // Facilita pesquisas por tipo
    },
    media: {
      type: mongoose5.Schema.Types.ObjectId,
      ref: "Media",
      default: null
      // Arquivo de mídia associado à mensagem
    },
    replyTo: {
      type: mongoose5.Schema.Types.ObjectId,
      ref: "Message",
      default: null
      // Mensagem que está sendo respondida
    }
  },
  {
    timestamps: true,
    // Cria createdAt e updatedAt automaticamente
    collection: "messages"
    // Nome da coleção no MongoDB
  }
);
var messageModel = mongoose5.models["Message"] ?? mongoose5.model("Message", messageSchema);
var message_model_default = messageModel;

// controllers/message_controller.ts
var messageController = {
  model: message_model_default,
  // Buscar mensagens de uma sala
  async findByRoom(req, res) {
    try {
      const roomId = req.params["roomId"];
      if (!roomId) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      const messages = await message_model_default.find({
        room: roomId
      }).populate("user").sort({
        createdAt: 1
      });
      return res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error(
        "[MESSAGE] Erro ao buscar mensagens:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar mensagens."
        }
      });
    }
  },
  // Criar uma mensagem
  async create(req, res) {
    try {
      const {
        user,
        content,
        type,
        media,
        replyTo
      } = req.body;
      const roomId = req.params["roomId"];
      if (!roomId) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da sala \xE9 obrigat\xF3rio."
          }
        });
      }
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "User \xE9 obrigat\xF3rio."
          }
        });
      }
      const room = await room_model_default.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Sala n\xE3o encontrada."
          }
        });
      }
      if (room.status === "closed") {
        return res.status(409).json({
          success: false,
          error: {
            status: 409,
            message: "A sala est\xE1 fechada."
          }
        });
      }
      const participant = room.participants.some(
        (participant2) => participant2.user.toString() === user
      );
      if (!participant) {
        return res.status(403).json({
          success: false,
          error: {
            status: 403,
            message: "Usu\xE1rio n\xE3o participa da sala."
          }
        });
      }
      if (!content && !media) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "A mensagem precisa possuir conte\xFAdo ou m\xEDdia."
          }
        });
      }
      const createdMessage = await message_model_default.create({
        room: roomId,
        user,
        content: content || "",
        type: type || "text",
        media: media || null,
        replyTo: replyTo || null
      });
      const message = await message_model_default.findById(createdMessage._id).populate("user");
      return res.status(201).json({
        success: true,
        data: message ?? createdMessage
      });
    } catch (error) {
      console.error(
        "[MESSAGE] Erro ao criar mensagem:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao criar mensagem."
        }
      });
    }
  },
  // Excluir uma mensagem
  async delete(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da mensagem \xE9 obrigat\xF3rio."
          }
        });
      }
      const message = await message_model_default.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "Mensagem n\xE3o encontrada."
          }
        });
      }
      await message_model_default.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(
        "[MESSAGE] Erro ao excluir mensagem:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao excluir mensagem."
        }
      });
    }
  }
};
var message_controller_default = messageController;

// routers/message_router.ts
var messageRouter = Router4();
messageRouter.get(
  "/rooms/:roomId/messages",
  message_controller_default.findByRoom
);
messageRouter.post(
  "/rooms/:roomId/messages",
  message_controller_default.create
);
messageRouter.delete(
  "/messages/:id",
  message_controller_default.delete
);
var message_router_default = messageRouter;

// routers/media_router.ts
import { Router as Router5 } from "express";

// models/media_model.ts
import mongoose6 from "mongoose";
var mediaSchema = new mongoose6.Schema(
  {
    user: {
      type: mongoose6.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Usuário responsável pelo arquivo
      index: true
      // Facilita buscar arquivos de um usuário
    },
    room: {
      type: mongoose6.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
      // Sala onde o arquivo foi utilizado
      index: true
      // Facilita buscar arquivos de uma sala
    },
    message: {
      type: mongoose6.Schema.Types.ObjectId,
      ref: "Message",
      default: null
      // Mensagem associada ao arquivo
    },
    type: {
      type: String,
      enum: [
        "image",
        // Imagem
        "video",
        // Vídeo
        "audio",
        // Áudio
        "document",
        // Documento
        "archive"
        // Arquivo compactado
      ],
      required: true,
      // Tipo do arquivo é obrigatório
      index: true
      // Facilita pesquisas por tipo de mídia
    },
    filename: {
      type: String,
      required: true,
      // Nome do arquivo é obrigatório
      trim: true,
      // Remove espaços extras
      maxlength: 255
      // Limite do nome do arquivo
    },
    mimeType: {
      type: String,
      required: true,
      // Tipo MIME do arquivo
      trim: true
    },
    size: {
      type: Number,
      required: true,
      // Tamanho do arquivo em bytes
      min: 0
      // O tamanho não pode ser negativo
    },
    url: {
      type: String,
      required: true,
      // Endereço usado para acessar o arquivo
      trim: true
    },
    width: {
      type: Number,
      default: null,
      // Largura da mídia em pixels
      min: 1
    },
    height: {
      type: Number,
      default: null,
      // Altura da mídia em pixels
      min: 1
    },
    duration: {
      type: Number,
      default: null,
      // Duração do áudio/vídeo em segundos
      min: 0
    },
    resolution: {
      type: String,
      enum: [
        "360p",
        // 640x360
        "720p",
        // 1280x720
        "1080p",
        // 1920x1080
        "1440p",
        // 2560x1440
        "2160p"
        // 3840x2160
      ],
      default: null
      // Resolução pode não existir para imagens/documentos
    }
  },
  {
    timestamps: true,
    // Cria createdAt e updatedAt automaticamente
    collection: "media"
    // Nome da coleção no MongoDB
  }
);
var mediaModel = mongoose6.models["Media"] ?? mongoose6.model("Media", mediaSchema);
var media_model_default = mediaModel;

// controllers/media_controller.ts
var mediaController = {
  model: media_model_default,
  async create(req, res) {
    try {
      const {
        user,
        room,
        message,
        type,
        filename,
        mimeType,
        size,
        url,
        width,
        height,
        duration,
        resolution
      } = req.body;
      if (!user || !type || !filename || !mimeType || size === void 0 || !url) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "User, type, filename, mimeType, size e url s\xE3o obrigat\xF3rios."
          }
        });
      }
      const media = await media_model_default.create({
        user,
        room: room || null,
        message: message || null,
        type,
        filename,
        mimeType,
        size,
        url,
        width: width || null,
        height: height || null,
        duration: duration || null,
        resolution: resolution || null
      });
      return res.status(201).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error(
        "[MEDIA] Erro ao criar m\xEDdia:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao criar m\xEDdia."
        }
      });
    }
  },
  async findById(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da m\xEDdia \xE9 obrigat\xF3rio."
          }
        });
      }
      const media = await media_model_default.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "M\xEDdia n\xE3o encontrada."
          }
        });
      }
      return res.status(200).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error(
        "[MEDIA] Erro ao buscar m\xEDdia:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao buscar m\xEDdia."
        }
      });
    }
  },
  async delete(req, res) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            status: 400,
            message: "ID da m\xEDdia \xE9 obrigat\xF3rio."
          }
        });
      }
      const media = await media_model_default.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            status: 404,
            message: "M\xEDdia n\xE3o encontrada."
          }
        });
      }
      await media_model_default.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(
        "[MEDIA] Erro ao excluir m\xEDdia:",
        error
      );
      return res.status(500).json({
        success: false,
        error: {
          status: 500,
          message: "Erro ao excluir m\xEDdia."
        }
      });
    }
  }
};
var media_controller_default = mediaController;

// routers/media_router.ts
var mediaRouter = Router5();
mediaRouter.post(
  "/",
  media_controller_default.create
);
mediaRouter.get(
  "/:id",
  media_controller_default.findById
);
mediaRouter.delete(
  "/:id",
  media_controller_default.delete
);
var media_router_default = mediaRouter;

// config/app.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var allowedOrigins = config_default.http.allowedOrigins ?? [];
var lanOrigin = /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || lanOrigin.test(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`Origem n\xE3o permitida pelo CORS: ${origin}`)
      );
    },
    credentials: true
  })
);
app.use(http_default.ipFilter);
app.use("/api/users", user_router_default);
app.use("/api/broadcasts", broadcast_router_default);
app.use("/api/rooms", room_router_default);
app.use("/api", message_router_default);
app.use("/api/media", media_router_default);
app.use(http_default.notFoundHandler);
app.use(http_default.errorHandler);
var app_default = app;

// config/mongodb.ts
import mongoose7 from "mongoose";
async function connect() {
  if (!config_default.mongodb.uri) {
    throw new Error(
      "MONGODB_URI n\xE3o configurada."
    );
  }
  try {
    await mongoose7.connect(
      config_default.mongodb.uri,
      {
        dbName: "open-chat-broadcast"
      }
    );
    console.log(
      "[MONGODB] Conectado ao MongoDB."
    );
    console.log(
      `[MONGODB] Database: ${mongoose7.connection.name}`
    );
  } catch (error) {
    console.error(
      "[MONGODB] Erro ao conectar:",
      error
    );
    throw error;
  }
}
async function disconnect() {
  await mongoose7.disconnect();
  console.log(
    "[MONGODB] Desconectado."
  );
}
var mongodb_default = {
  connect,
  disconnect
};

// serverless/api-handler.ts
var connectionPromise = null;
async function ensureDatabaseConnection() {
  if (mongoose8.connection.readyState === 1) {
    return;
  }
  if (!connectionPromise) {
    connectionPromise = mongodb_default.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
}
async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
    app_default(req, res);
  } catch (error) {
    console.error("[VERCEL API] Erro ao preparar a API:", error);
    if (!res.headersSent) {
      res.status(503).json({
        error: "Servi\xE7o temporariamente indispon\xEDvel."
      });
    }
  }
}
export {
  handler as default
};
