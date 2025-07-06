import { PrismaClient } from '../generated/prisma/client.js'
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export const checkPassword = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { password: true }
        })

        if (!user) {
            return res.status(404).json({
                isValid: false,
                message: 'Пользователь не найден'
            })
        }

        const isValidPass = await bcrypt.compare(req.body.password, user.password)

        if (!isValidPass) {
            return res.status(400).json({
                isValid: false,
                message: 'Неверный пароль'
            })
        }

        res.json({
            isValid: true,
            message: 'Верный пароль'
        })
    } catch (err) {
        console.log('Ошибка с сервером ' + err)
        res.status(500).json({
            message: 'Не удалось проверить пароль'
        })
    }
}
