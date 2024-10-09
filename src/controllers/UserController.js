import bcrypt from "bcrypt";
import User from "../models/User.js";
import 'dotenv/config.js';
import * as TokenService from '../services/TokenService.js'

export const register = async (req, res) => {

    try {

        const { password, email, name } = req.body

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const isExistUserWithName = await User.findOne({ name });

        if (isExistUserWithName) {
            return res.status(400).json({ message: 'Имя занято' });
        }

        const isExistUserWithEmail = await User.findOne({ email });

        if (isExistUserWithEmail) {
            return res.status(400).json({ message: 'E-mail уже используется' });
        }

        const document = new User({
            email,
            name,
            password: passwordHash,
        });

        const user = await document.save();
        const token = TokenService.createToken({_id: user._id});

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

        const token = TokenService.createToken({_id: user._id});

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

        res.status(200).json({
            message: 'Успешная авторизация'
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Ошибка авторизации'
        })
    }
}

export const getUserAvatar = async (req, res) => {

    try {

        const user = await User.findById(req.userId, {avatarSeed: 1});

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }

        res.json({
            avatarSeed: user.avatarSeed ?? 'none',
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Ошибка при загрузке аватара'
        })
    }

}

export const saveUserAvatar = async (req, res) => {

    try {

        await User.updateOne(
            { _id: req.userId },
            { $set: { avatarSeed: req.body.seed } }
        );

        res.json({
            message: 'Аватар изменен'
        })

    } catch(err) {
        console.log(err);
        res.status(500).json({
            message: 'Ошибка при сохранении сида аватарки'
        })
    }

}