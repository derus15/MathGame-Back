import {ApiError} from "../api/ApiError.js";

export const ErrorMiddleware = (err, req, res, next) => {
    // console.log('ВОЗНИКЛА ОШИБКА', err);
    if (err instanceof ApiError) {
        return res.status(err.status).json({message: err.message})
    }

    return res.status(500).json({message: 'Серверная ошибка'})
};
