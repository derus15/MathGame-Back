import Session from "../models/Session.js";

export const saveSession = async (req, res) => {

    try {

        const session = new Session({

            sign: req.body.sign,
            mode: req.body.mode,
            time: req.body.time,
            number: req.body.number,
            eps: req.body.eps,
            modifications: req.body.modifications,
            unexpectedEnd: req.body.unexpectedEnd,
            user: req.userId,

        })

        const result = await session.save();
        res.status(200).json(result)

    } catch (err) {
        console.log('С отправкой сессии произошла ошибка ' + err);
        res.status(500).json({
            message: 'Не удалось отправить данные сессии'
        })
    }
}
