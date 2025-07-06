import jwt from "jsonwebtoken";

export const createToken = (payload) => {

    const accessToken = jwt.sign(payload, process.env.SECRET || '123', {expiresIn: '1h'});
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET || '123refresh', {expiresIn: '14d'});

    return {
        accessToken,
        refreshToken,
    }
}
