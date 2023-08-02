import jwt from 'jsonwebtoken'

export default (req, res, next) => {

    const token = (req.headers.authorization)

    if (token) {

        try {

            const decoded = jwt.verify(token, process.end.SECRET);

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