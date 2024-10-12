export class ApiError extends Error {

    constructor(status, message) {
        super(message);
        this.status = status;
    }

    static UnauthorizedError() {
        return new ApiError(401, 'Пользователь не авторизован');
    }

    static ForbiddenError() {
        return new ApiError(403, 'Нет доступа');
    }

    static BadRequest(message) {
        return new ApiError(400, message);
    }

    static NotFound(message) {
        return new ApiError(404, message)
    }
}
