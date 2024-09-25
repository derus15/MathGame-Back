import User from "../models/User.js";
import Session from "../models/Session.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {timeNormalization} from "../utils/timeNormalization.js";

export const getAccountUserInfo = async (req, res) => {

    try {

        const user = await User.findById(req.userId, {name: 1});
        const timeInfo = await Session.aggregate([

            {$match: {user: new mongoose.Types.ObjectId(req.userId)}},
            {$group: {_id: "$user", totalTime: {$sum: "$time"}}},

        ]);

        const exampleInfo = await Session.aggregate([

            {$match: {user: new mongoose.Types.ObjectId(req.userId)}},
            {$group: {_id: "$user", totalExample: {$sum: "$number"}}},

        ]);

        const result = {
            user,
            totalTimeInfo: timeInfo[0]?.totalTime || 0,
            totalExampleInfo: exampleInfo[0]?.totalExample || 0,
        }

        res.status(200).json(result);

    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err);
        res.status(500).json({
            message: 'Не удалось получить данные'
        })
    }

}

export const getAccountDataHighlight = async (req, res) => {

    try {

        const user = new mongoose.Types.ObjectId(req.userId);

        const timeBoard = await Session.aggregate([
            {
                $match: {
                    user: user,
                    unexpectedEnd: false,
                    mode: 'Стандарт',
                    $or: [
                        {time: 15},
                        {time: 30},
                        {time: 60}
                    ]
                }
            },
            {
                $group: {
                    _id: "$time",
                    title: { $max: "$time" },
                    eps: { $max: "$eps" },
                    additionalParameter: { $max: "$number" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const numberBoard = await Session.aggregate([
            {
                $match: {
                    user: user,
                    unexpectedEnd: false,
                    mode: 'Спринт',
                    $or: [
                        { number: 10 },
                        { number: 15 },
                        { number: 20 }
                    ]
                }
            },
            {
                $group: {
                    _id: "$number",
                    title: { $max: "$number" },
                    eps: { $max: "$eps" },
                    additionalParameter: { $min: "$time" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        timeBoard.forEach(item => {
            item.title = timeNormalization(item.title);
        });

        numberBoard.forEach(item => {
            item.additionalParameter = timeNormalization(item.additionalParameter)
        })

        res.status(200).json({timeBoard: timeBoard, numberBoard: numberBoard});

    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err);
        res.status(500).json({
            message: 'Не удалось получить данные'
        })
    }

}

export const changeAccountData = async (req, res) => {

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

export const getName = async (req, res) => {

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