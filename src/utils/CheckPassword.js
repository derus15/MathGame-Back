import { eq } from 'drizzle-orm';
import { users } from '../../db/schema.js';
import bcrypt from 'bcrypt';
import {db} from "../../db/client.js";

export const checkPassword = async (req, res) => {
    try {
        const userId = Number(req.userId);

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { password: true },
        });

        if (!user) {
            return res.status(404).json({
                isValid: false,
                message: 'Пользователь не найден',
            });
        }

        const isValidPass = await bcrypt.compare(req.body.password, user.password);

        if (!isValidPass) {
            return res.status(400).json({
                isValid: false,
                message: 'Неверный пароль',
            });
        }

        res.json({
            isValid: true,
            message: 'Верный пароль',
        });
    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Не удалось проверить пароль',
        });
    }
};
