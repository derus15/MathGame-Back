import jwt from "jsonwebtoken";

export const createToken = (payload) => {

    const accessToken = jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'});
    const refreshToken = jwt.sign(payload, process.env.SECRET, {expiresIn: '1d'});

    return {
        accessToken,
        refreshToken,
    }
}
