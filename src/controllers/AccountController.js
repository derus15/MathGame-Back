import bcrypt from "bcrypt";
import {timeNormalization} from "../utils/timeNormalization.js";
import { PrismaClient } from '../generated/prisma/client.js'

const prisma = new PrismaClient()

export const getAccountUserInfo = async (req, res) => {
    try {
        const userId = req.userId

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        const timeAgg = await prisma.session.aggregate({
            where: { userId },
            _sum: { time: true }
        })

        const exampleAgg = await prisma.session.aggregate({
            where: { userId },
            _sum: { number: true }
        })

        const result = {
            user,
            totalTimeInfo: timeAgg._sum.time || 0,
            totalExampleInfo: exampleAgg._sum.number || 0
        }

        res.status(200).json(result)
    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err)
        res.status(500).json({
            message: 'Не удалось получить данные'
        })
    }
}

export const getAccountDataHighlight = async (req, res) => {
    try {
        const userId = req.userId

        const timeOptions = [15, 30, 60]
        const numberOptions = [10, 15, 20]

        const standardSessions = await prisma.session.findMany({
            where: {
                userId,
                unexpectedEnd: false,
                mode: 'Стандарт',
                time: { in: timeOptions }
            },
            select: {
                time: true,
                eps: true,
                number: true
            }
        })

        const sprintSessions = await prisma.session.findMany({
            where: {
                userId,
                unexpectedEnd: false,
                mode: 'Спринт',
                number: { in: numberOptions }
            },
            select: {
                number: true,
                eps: true,
                time: true
            }
        })

        const groupedTimeBoard = Object.fromEntries(
            timeOptions.map(option => {
                const filtered = standardSessions.filter(s => s.time === option)
                const best = filtered.reduce((acc, curr) => {
                    if (!acc || (curr.eps > acc.eps)) return curr
                    return acc
                }, null)

                return [
                    option,
                    {
                        title: timeNormalization(option),
                        eps: best?.eps ?? null,
                        additionalParameter: best?.number ?? null
                    }
                ]
            })
        )

        const groupedNumberBoard = Object.fromEntries(
            numberOptions.map(option => {
                const filtered = sprintSessions.filter(s => s.number === option)
                const best = filtered.reduce((acc, curr) => {
                    if (!acc || (curr.eps > acc.eps)) return curr
                    return acc
                }, null)

                return [
                    option,
                    {
                        title: option,
                        eps: best?.eps ?? null,
                        additionalParameter: best?.time ? timeNormalization(best.time) : null
                    }
                ]
            })
        )

        const normalizedTimeBoard = timeOptions.map(t => groupedTimeBoard[t])
        const normalizedNumberBoard = numberOptions.map(n => groupedNumberBoard[n])

        res.status(200).json({
            timeBoard: normalizedTimeBoard,
            numberBoard: normalizedNumberBoard
        })
    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err)
        res.status(500).json({
            message: 'Не удалось получить данные'
        })
    }
}

export const changeAccountData = async (req, res) => {
    try {
        const { name: newNameRaw, password: newPasswordRaw } = req.body
        const userId = req.userId

        if (!newNameRaw && !newPasswordRaw) {
            return res.status(400).json({ message: 'Нет данных' })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        if (newNameRaw && newNameRaw !== user.name) {
            const existUserWithName = await prisma.user.findUnique({
                where: { name: newNameRaw }
            })
            if (existUserWithName) {
                return res.status(400).json({ message: 'Имя занято' })
            }
        }

        let newHashedPassword = user.password
        if (newPasswordRaw) {
            const isEqualPass = await bcrypt.compare(newPasswordRaw, user.password)
            if (isEqualPass) {
                return res.status(400).json({ message: 'Вы используете старый пароль' })
            }
            const salt = await bcrypt.genSalt(10)
            newHashedPassword = await bcrypt.hash(newPasswordRaw, salt)
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                name: newNameRaw || user.name,
                password: newHashedPassword
            }
        })

        res.status(200).json({ message: 'Данные обновлены' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Не удалось обновить данные' })
    }
}

export const getName = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { name: true }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        res.json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Нет доступа' })
    }
}
