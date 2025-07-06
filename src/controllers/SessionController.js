import { PrismaClient } from '../generated/prisma/client.js'

const prisma = new PrismaClient()

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
        } = req.body

        const result = await prisma.session.create({
            data: {
                sign,
                mode,
                time,
                rounds,
                number,
                eps,
                modifications,
                unexpectedEnd,
                userId: req.userId,
            },
        })

        res.status(200).json(result)
    } catch (err) {
        console.log('С отправкой сессии произошла ошибка ' + err)
        res.status(500).json({
            message: 'Не удалось отправить данные сессии',
        })
    }
}
