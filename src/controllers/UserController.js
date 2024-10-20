import bcrypt from "bcrypt";
import User from "../models/User.js";
import 'dotenv/config.js';
import * as TokenService from '../services/TokenService.js'
import {ApiError} from "../api/ApiError.js";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {

    try {

        const { password, email, name } = req.body

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const isExistUserWithName = await User.findOne({ name });

        if (isExistUserWithName) {
            return next(ApiError.BadRequest('Имя занято'));
        }

        const isExistUserWithEmail = await User.findOne({ email });

        if (isExistUserWithEmail) {
            return next(ApiError.BadRequest('E-mail уже используется'));
        }

        const document = new User({
            email,
            name,
            password: passwordHash,
        });

        const user = await document.save();
        const {accessToken} = TokenService.createToken({_id: user._id});

        res.json({token: accessToken});

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        next(err);
    }
}

export const login = async (req, res, next) => {

    try {

        const user = await User.findOne({email: req.body.email})

        if (!user) {
            return next(ApiError.NotFound('Пользователь не найден'));
        }

        const isValidPass = await bcrypt.compare(req.body.password, user.password);

        if (!isValidPass) {
            return next(ApiError.BadRequest('Неверный логин или пароль'));
        }

        const {accessToken, refreshToken} = TokenService.createToken({_id: user._id});
        res.cookie('refreshToken', refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});

        res.json({token: accessToken})

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        next(err);
    }
}

export const refreshToken = async (req, res, next) => {

    try {

        const {refreshToken} = req.cookies;

        if (!refreshToken) {
            return next(ApiError.UnauthorizedError());
        }

        try {
            const isDecoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
            req.userId = isDecoded._id;
        } catch (e) {
            return next(ApiError.ForbiddenError());
        }

        const user = await User.findById(req.userId);

        const newTokens = TokenService.createToken({_id: user._id});
        res.cookie('refreshToken', newTokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});

        return res.json({
            accessToken: newTokens.accessToken
        });

    } catch (err) {
        console.log(err);
        next(err);
    }

}

export const logout = async (req, res, next) => {

    try {

        res.clearCookie('refreshToken', { httpOnly: true });
        return res.json({message: 'Токен аннулирован'});

    } catch (err) {
        next(err);
    }

}

export const getMe = async (req, res) => {

    try {

        res.status(200).json({
            message: 'Успешная авторизация'
        })

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Ошибка авторизации'
        })
    }
}

export const getUserAvatar = async (req, res, next) => {

    try {

        const user = await User.findById(req.userId, {avatarSeed: 1});

        if (!user) {
            return next(ApiError.NotFound('Пользователь не найден'));
        }

        res.json({
            avatarSeed: user.avatarSeed ?? 'none',
        });

    } catch (err) {
        console.log('Ошибка с сервером ' + err);
        next(err);
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
        console.log('Ошибка с сервером ' + err);
        res.status(500).json({
            message: 'Ошибка при сохранении сида аватарки'
        })
    }

}