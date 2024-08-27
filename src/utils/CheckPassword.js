import User from "../models/User.js";
import bcrypt from "bcrypt";

export const checkPassword = async (req, res) => {

    try {

        const user = await User.findById(req.userId);

        const isValidPass = await bcrypt.compare(req.body.password, user.password);

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
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Не удалось проверить пароль'
        })
    }
}