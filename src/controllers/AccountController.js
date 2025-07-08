import {eq, inArray, and, sum} from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { users, sessions } from "../../db/schema.js";
import { timeNormalization } from '../utils/timeNormalization.js';
import 'dotenv/config.js';
import { db } from "../../db/client.js";

export const getAccountUserInfo = async (req, res) => {
    try {
        const userId = Number(req.userId);

        const user = await db.query.users.findFirst({
            columns: { name: true },
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const sessionData = await db
            .select({
                totalTime: sum(sessions.time).as('totalTime'),
                totalExample: sum(sessions.number).as('totalExample'),
            })
            .from(sessions)
            .where(eq(sessions.userId, userId));

        const { totalTime = 0, totalExample = 0 } = sessionData[0] || {};

        res.status(200).json({
            user,
            totalTimeInfo: totalTime,
            totalExampleInfo: totalExample,
        });
    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err);
        res.status(500).json({ message: 'Не удалось получить данные' });
    }
};

export const getAccountDataHighlight = async (req, res) => {
    try {
        const userId = Number(req.userId);
        const timeOptions = [15, 30, 60];
        const numberOptions = [10, 15, 20];

        const standardSessions = await db
            .select({
                time: sessions.time,
                eps: sessions.eps,
                number: sessions.number,
            })
            .from(sessions)
            .where(
                and(
                    eq(sessions.userId, userId),
                    eq(sessions.mode, 'Стандарт'),
                    eq(sessions.unexpectedEnd, false),
                    inArray(sessions.time, timeOptions)
                )
            );

        const sprintSessions = await db
            .select({
                number: sessions.number,
                eps: sessions.eps,
                time: sessions.time,
            })
            .from(sessions)
            .where(
                and(
                    eq(sessions.userId, userId),
                    eq(sessions.mode, 'Спринт'),
                    eq(sessions.unexpectedEnd, false),
                    inArray(sessions.number, numberOptions)
                )
            );

        const groupedTimeBoard = Object.fromEntries(
            timeOptions.map(option => {
                const filtered = standardSessions.filter(s => s.time === option);
                const best = filtered.reduce((acc, curr) => {
                    if (!acc || (curr.eps > acc.eps)) return curr;
                    return acc;
                }, null);

                return [
                    option,
                    {
                        title: timeNormalization(option),
                        eps: best?.eps ?? null,
                        additionalParameter: best?.number ?? null,
                    },
                ];
            })
        );

        const groupedNumberBoard = Object.fromEntries(
            numberOptions.map(option => {
                const filtered = sprintSessions.filter(s => s.number === option);
                const best = filtered.reduce((acc, curr) => {
                    if (!acc || (curr.eps > acc.eps)) return curr;
                    return acc;
                }, null);

                return [
                    option,
                    {
                        title: option,
                        eps: best?.eps ?? null,
                        additionalParameter: best?.time ? timeNormalization(best.time) : null,
                    },
                ];
            })
        );

        res.status(200).json({
            timeBoard: timeOptions.map(t => groupedTimeBoard[t]),
            numberBoard: numberOptions.map(n => groupedNumberBoard[n]),
        });
    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err);
        res.status(500).json({ message: 'Не удалось получить данные' });
    }
};

export const changeAccountData = async (req, res) => {
    try {
        const { name: newNameRaw, password: newPasswordRaw } = req.body;
        const userId = Number(req.userId);

        if (!newNameRaw && !newPasswordRaw) {
            return res.status(400).json({ message: 'Нет данных' });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (newNameRaw && newNameRaw !== user.name) {
            const nameExists = await db.query.users.findFirst({
                where: eq(users.name, newNameRaw),
            });
            if (nameExists) {
                return res.status(400).json({ message: 'Имя занято' });
            }
        }

        let newPasswordHash = user.password;
        if (newPasswordRaw) {
            const isSamePass = await bcrypt.compare(newPasswordRaw, user.password);
            if (isSamePass) {
                return res.status(400).json({ message: 'Вы используете старый пароль' });
            }
            const salt = await bcrypt.genSalt(10);
            newPasswordHash = await bcrypt.hash(newPasswordRaw, salt);
        }

        await db.update(users)
            .set({
                name: newNameRaw || user.name,
                password: newPasswordHash,
            })
            .where(eq(users.id, userId));

        res.status(200).json({ message: 'Данные обновлены' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Не удалось обновить данные' });
    }
};

export const getName = async (req, res) => {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, Number(req.userId)),
            columns: { name: true },
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Нет доступа' });
    }
};
