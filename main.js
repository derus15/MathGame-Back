import express from 'express';
import mongoose from "mongoose";
import {loginValidator, registerValidator} from "./src/utils/Validators.js";
import checkAuth from "./src/utils/CheckAuth.js";
import cors from 'cors';
import * as UserController from './src/controllers/UserController.js'
import * as SessionController from './src/controllers/SessionController.js'
import HandleValidationsErrors from "./src/utils/HandleValidationsErrors.js";

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('База подключена'))
    .catch((err) => {
        console.log(err)
    })

const app = express();
const PORT = 3020;
const whiteList = ['http://localhost:3000/', process.env.CORS_WHITE_LIST];

app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (whiteList.indexOf(origin) === -1) {
            const msg = 'CORS Error';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.post('/auth/register', registerValidator, HandleValidationsErrors, UserController.register)
app.post('/auth/login', loginValidator, HandleValidationsErrors, UserController.login);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/session', checkAuth, SessionController.saveSession)
app.get('/account', checkAuth, SessionController.account)

app.listen(process.env.PORT || PORT, (err) => {
    if (err) {
        console.log(err)
    }
    console.log('Сервер работает на порту ' + PORT)
})