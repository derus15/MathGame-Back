import Session from "../models/Session.js";
import mongoose from "mongoose";
import User from "../models/User.js";

export const saveSession = async (req, res) => {

    try {

        const session = new Session({

            sign: req.body.sign,
            mode: req.body.mode,
            time: req.body.time,
            number: req.body.number,
            user: req.userId,

        })

        const result = await session.save();
        res.status(200).json(result)

    } catch (err) {
        console.log('С отправкой сессии произошла ошибка ' + err);
        res.status(500).json({
            message: 'Не удалось отправить данные сессии'
        })
    }
}

export const account = async (req, res) => {

    try {

        const user = await User.findById(req.userId, {name: 1});
        const counterTime = await Session.aggregate([

            {$match: {user: new mongoose.Types.ObjectId(req.userId)}},
            {$group: {_id: "$user", total_time: {$sum: "$time"}}},

        ]);

        const counterExample = await Session.aggregate([

            {$match: {user: new mongoose.Types.ObjectId(req.userId)}},
            {$group: {_id: "$user", total_example: {$sum: "$number"}}},

        ]);

        res.status(200).json({user, counterTime, counterExample});

    } catch (err) {
        console.log('С загрузкой данных произошла ошибка ' + err);
        res.status(500).json({
            message: 'Не удалось получить данные'
        })
    }

}