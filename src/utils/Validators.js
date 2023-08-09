import {body} from "express-validator";

export const registerValidator = [
    body('email').isEmail().withMessage('Некорректный e-mail'),
    body('name').isLength({min: 2, max: 20}).withMessage('Некорректное имя'),
    body('password').isLength({min: 5}).withMessage('Некорректный пароль'),
]

export const loginValidator = [
    body('email', 'Неверный e-mail').isEmail(),
]
