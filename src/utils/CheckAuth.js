import jwt from 'jsonwebtoken'
import 'dotenv/config.js';

export default (req, res, next) => {

    const token = (req.headers.authorization)

    // const token = (req.headers.authorization || '').split(' ')[1]

    if (token) {

        try {

            const decoded = jwt.verify(token, process.env.SECRET);

            req.userId = decoded._id;
            next();

        } catch (err) {

            return res.status(403).json({
                message: 'нет доступа'
            })

        }

    } else {

        return res.status(408).json({
            message: 'Нет доступа'

        })
    }
}