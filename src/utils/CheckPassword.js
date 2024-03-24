import User from "../models/User.js";
import bcrypt from "bcrypt";

export const checkPassword = async (req, res) => {

    try {

        const user = await User.findById(req.userId);

        const isValidPass = await bcrypt.compare(req.body.password, user.password);

        if (!isValidPass) {
            return res.status(400).json({
                message: 'Неверный пароль'
            })
        }

        res.json({
            isValid: true
        })

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Не удалось проверить пароль'
        })
    }
}