import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import 'dotenv/config.js';
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import * as TokenService from "../services/TokenService.js";
import { ApiError } from "../api/ApiError.js";
import { db } from "../../db/client.js";

export const register = async (req, res, next) => {
    try {
        const { password, email, name } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [userWithName] = await db.select().from(users).where(eq(users.name, name));
        if (userWithName) {
            return next(ApiError.BadRequest("Имя занято"));
        }

        const [userWithEmail] = await db.select().from(users).where(eq(users.email, email));
        if (userWithEmail) {
            return next(ApiError.BadRequest("E-mail уже используется"));
        }

        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email,
                password: passwordHash,
            })
            .returning();

        const { accessToken, refreshToken } = TokenService.createToken({ id: newUser.id });

        res.cookie("refreshToken", refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "None",
            secure: true,
            domain: ".math-game.ru",
        });

        res.json({ token: accessToken });
    } catch (err) {
        console.log("Ошибка с сервером: ", err);
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            return next(ApiError.NotFound("Пользователь не найден"));
        }

        const isValidPass = await bcrypt.compare(password, user.password);
        if (!isValidPass) {
            return next(ApiError.BadRequest("Неверный логин или пароль"));
        }

        const { accessToken, refreshToken } = TokenService.createToken({ id: user.id });

        res.cookie("refreshToken", refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "None",
            secure: true,
        });

        res.json({ token: accessToken });
    } catch (err) {
        console.log("Ошибка с сервером: ", err);
        next(err);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return next(ApiError.UnauthorizedError());

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        } catch (e) {
            return next(ApiError.ForbiddenError());
        }

        const [user] = await db.select().from(users).where(eq(users.id, decoded?.id));
        if (!user) return next(ApiError.UnauthorizedError());

        const newTokens = TokenService.createToken({ id: user.id });

        res.cookie("refreshToken", newTokens.refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "None",
            secure: true,
            domain: ".math-game.ru",
        });

        res.json({ accessToken: newTokens.accessToken });
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.clearCookie("refreshToken", { httpOnly: true });
        res.json({ message: "Токен аннулирован" });
    } catch (err) {
        next(err);
    }
};

export const getMe = async (req, res) => {
    try {
        res.status(200).json({ message: "Успешная авторизация" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка авторизации" });
    }
};

export const getUserAvatar = async (req, res, next) => {
    try {
        const [user] = await db
            .select({ avatarSeed: users.avatarSeed })
            .from(users)
            .where(eq(users.id, req.userId));

        if (!user) return next(ApiError.NotFound("Пользователь не найден"));

        res.json({ avatarSeed: user.avatarSeed ?? "none" });
    } catch (err) {
        console.log("Ошибка с сервером: ", err);
        next(err);
    }
};

export const saveUserAvatar = async (req, res) => {
    try {
        await db
            .update(users)
            .set({ avatarSeed: req.body.seed })
            .where(eq(users.id, req.userId));

        res.json({ message: "Аватар изменен" });
    } catch (err) {
        console.log("Ошибка с сервером: ", err);
        res.status(500).json({ message: "Ошибка при сохранении сида аватарки" });
    }
};