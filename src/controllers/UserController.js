import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import 'dotenv/config.js';

export const register = async (req, res) => {

    try {

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const existUserWithEmail = await User.findOne({ email: req.body.email });
        if (existUserWithEmail) {
            return res.status(400).json({ message: 'E-mail уже используется' });
        }

        const existUserWithName = await User.findOne({ name: req.body.name });
        if (existUserWithName) {
            return res.status(400).json({ message: 'Имя занято' });
        }

        const document = new User({
            email: req.body.email,
            name: req.body.name,
            password: passwordHash,
        });

        const user = await document.save();
        const token = jwt.sign({_id: user._id}, process.env.SECRET, {expiresIn: '1d'});

        res.json({token});

    } catch (err) {
        console.log('Ошибка с сервером ' + err)
        res.status(500).json({
            message: 'Ошибка сервера'
        })
    }
}

export const login = async (req, res) => {

    try {

        const user = await User.findOne({email: req.body.email})

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }

        const isValidPass = await bcrypt.compare(req.body.password, user.password);

        if (!isValidPass) {
            return res.status(400).json({
                message: 'Неверный логин или пароль'
            })
        }

        const token = jwt.sign({_id: user._id}, process.env.SECRET, {expiresIn: '1d'});

        res.json({token})

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Не удалось авторизоваться'
        })
    }
}

export const getMe = async (req, res) => {

    try {

        const user = await User.findById(req.userId, {name: 1});

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }

        res.json(user);

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Нет доступа'
        })
    }
}

export const changeProfile = async (req, res) => {

    try {

        const user = await User.findById(req.userId);
        const isEqualPass = await bcrypt.compare(req.body.password, user.password);

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);

        let newName =  req.body.name;
        let newPassword = await bcrypt.hash(password, salt);

        if (isEqualPass) {
            return res.status(400).json({ message: 'Вы используете старый пароль' });
        }

        const existUserWithName = await User.findOne({ name: req.body.name });
        if (existUserWithName) {
            return res.status(400).json({ message: 'Имя занято' });
        }

        if (!req.body.name && !req.body.password) {
            return res.status(400).json({
                message: 'Нет данных'
            });
        }

        if (!req.body.name) {
            newName = user.name;
        }

        if (!req.body.password) {
            newPassword = user.password;
        }

        await User.updateOne(
            { _id: req.userId },
            { $set:
                    {
                        name: newName,
                        password: newPassword,
                    }
            }
        );

        res.status(200).json({
            message: 'Данные обновлены'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Не удалось обновить данные'
        });
    }
}

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
