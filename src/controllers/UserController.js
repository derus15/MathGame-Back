import bcrypt from "bcrypt";
import 'dotenv/config.js';
import * as TokenService from '../services/TokenService.js'
import {ApiError} from "../api/ApiError.js";
import jwt from "jsonwebtoken";
import { PrismaClient } from '../generated/prisma/client.js'

const prisma = new PrismaClient()

export const register = async (req, res, next) => {
    try {
        const { password, email, name } = req.body

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)

        const isExistUserWithName = await prisma.user.findUnique({
            where: { name },
        })

        if (isExistUserWithName) {
            return next(ApiError.BadRequest('Имя занято'))
        }

        const isExistUserWithEmail = await prisma.user.findUnique({
            where: { email },
        })

        if (isExistUserWithEmail) {
            return next(ApiError.BadRequest('E-mail уже используется'))
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordHash,
            },
        })

        const { accessToken, refreshToken } = TokenService.createToken({ id: user.id })

        res.cookie('refreshToken', refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            domain: '.math-game.ru',
        })

        res.json({ token: accessToken })
    } catch (err) {
        console.log('Ошибка с сервером: ' + err)
        next(err)
    }
}

export const login = async (req, res, next) => {
    try {

        const { email, password } = req.body

        if (!email || !password) {
            return next(ApiError.BadRequest('Email и пароль обязательны'))
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return next(ApiError.NotFound('Пользователь не найден'))
        }

        const isValidPass = await bcrypt.compare(password, user.password)
        if (!isValidPass) {
            return next(ApiError.BadRequest('Неверный логин или пароль'))
        }
        console.log('---Body', req.body, 'id', user.id)
        const { accessToken, refreshToken } = TokenService.createToken({ id: user.id })

        res.cookie('refreshToken', refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            // domain: '.math-game.ru'
        })

        res.json({ token: accessToken })

    } catch (err) {
        console.log('Ошибка с сервером: ', err)
        next(err)
    }
}

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies

        if (!refreshToken) {
            return next(ApiError.UnauthorizedError())
        }

        let decoded
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_SECRET || '123refresh'
            )
        } catch (e) {
            return next(ApiError.ForbiddenError())
        }

        const userId = decoded?.id

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return next(ApiError.UnauthorizedError())
        }

        const newTokens = TokenService.createToken({ id: user.id })

        res.cookie('refreshToken', newTokens.refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            domain: '.math-game.ru'
        })

        return res.json({
            accessToken: newTokens.accessToken
        })
    } catch (err) {
        console.log(err)
        next(err)
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
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { avatarSeed: true }
        })

        if (!user) {
            return next(ApiError.NotFound('Пользователь не найден'))
        }

        res.json({
            avatarSeed: user.avatarSeed ?? 'none'
        })
    } catch (err) {
        console.log('Ошибка с сервером ' + err)
        next(err)
    }
}

export const saveUserAvatar = async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: { avatarSeed: req.body.seed }
        })

        res.json({
            message: 'Аватар изменен'
        })
    } catch (err) {
        console.log('Ошибка с сервером ' + err)
        res.status(500).json({
            message: 'Ошибка при сохранении сида аватарки'
        })
    }
}