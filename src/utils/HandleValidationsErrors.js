import {validationResult} from "express-validator";

export default (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()){
        const errorMessages = errors.array().map(error => error.msg);

        if (errorMessages.includes('Некорректное имя')) {
            return res.status(450).json({error: 'Некорректное имя'});
        }

        else if (errorMessages.includes('Некорректный e-mail')) {
            return res.status(451).json({error: 'Некорректный e-mail'});
        }

        else if (errorMessages.includes('Некорректный пароль')) {
            return res.status(452).json({error: 'Некорректный пароль'});
        }

        return res.status(400).json({errors: errors.array()});
    }

    next();
}
