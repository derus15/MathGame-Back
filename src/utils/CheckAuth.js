import jwt from 'jsonwebtoken'
import 'dotenv/config.js';
import {ApiError} from "../api/ApiError.js";

export default (req, res, next) => {

    const token = (req.headers.authorization)
    // const token = (req.headers.authorization || '').split(' ')[1]

        try {

            if(!token) { return next(ApiError.ForbiddenError())}

            const decoded = jwt.verify(token, process.env.SECRET);

            req.userId = decoded._id;
            next();

        } catch (err) {

            return res.status(403).json({
                message: 'Нет доступа'
            })

        }

}