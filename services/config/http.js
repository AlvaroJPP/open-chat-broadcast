import config from "./config.js";

const http = {
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
    badRequest(res, message = "Requisição inválida") {
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
    unauthorized(res, message = "Não autenticado") {
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
    notFound(res, message = "Recurso não encontrado") {
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
    asyncHandler(handler) {
        return async (req, res, next) => {
            try {
                await handler(req, res, next);
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
                message:
                    error.message ||
                    "Erro interno do servidor"
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
                message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
            }
        });
    },

    ipFilter(req, res, next) {
        const access = config.http.access;

        if (access.allowAll) {
            return next();
        }

        const clientIP =
            req.ip ||
            req.socket.remoteAddress;

        const normalizedIP = clientIP?.replace(/^::ffff:/, "");

        if (access.allowedIPs.includes(normalizedIP)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            error: {
                status: 403,
                message: "IP não autorizado"
            }
        });
    }

};

export default http;