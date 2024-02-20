import {body} from "express-validator";

export const registerValidator = [
    body('email').isEmail().withMessage('Некорректный e-mail'),
    body('name').trim().isLength({min: 2, max: 20}).withMessage('Некорректное имя'),
    body('password').trim().isLength({min: 5}).withMessage('Некорректный пароль'),
]

export const loginValidator = [
    body('email', 'Неверный e-mail').isEmail(),
]

export const updateDataValidator = [
    body('name')
        .trim()
        .custom((value, { req }) => {
            if (!req.body.name) {
                return true;
            }

            if (req.body.name && req.body.name.length >= 2) {
                return true
            }
        })
        .withMessage('Некорректное имя'),

    body('password')
        .trim()
        .custom((value, { req }) => {
            if (!req.body.password ) {
                return true;
            }

            if (req.body.password && req.body.password.length >= 5) {
                return true
            }
        })
        .withMessage('Некорректный пароль'),
]