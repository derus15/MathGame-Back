import { sessions } from "../../db/schema.js";
import {db} from "../../db/client.js";

export const saveSession = async (req, res) => {
    try {
        const {
            sign,
            mode,
            time,
            rounds,
            number,
            eps,
            modifications,
            unexpectedEnd,
        } = req.body;

        const [result] = await db
            .insert(sessions)
            .values({
                sign,
                mode,
                time,
                rounds,
                number,
                eps,
                modifications,
                unexpectedEnd,
                userId: req.userId,
            })
            .returning();

        res.status(200).json(result);
    } catch (err) {
        console.log('С отправкой сессии произошла ошибка:', err);
        res.status(500).json({
            message: 'Не удалось отправить данные сессии',
        });
    }
};
