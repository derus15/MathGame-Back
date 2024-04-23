import express from 'express';
import mongoose from "mongoose";
import {loginValidator, registerValidator, updateDataValidator} from "./src/utils/Validators.js";
import checkAuth from "./src/utils/CheckAuth.js";
import cors from 'cors';
import * as UserController from './src/controllers/UserController.js'
import * as SessionController from './src/controllers/SessionController.js'
import * as AccountController from './src/controllers/AccountController.js'
import HandleValidationsErrors from "./src/utils/HandleValidationsErrors.js";
import 'dotenv/config.js';
import {checkPassword} from "./src/utils/CheckPassword.js";

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('База подключена'))
    .catch((err) => {
        console.log(err)
    })

const app = express();
const PORT = 3020;
const whiteList = [ process.env.CORS_WHITE_LIST ];

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
app.get('/auth/init', checkAuth, UserController.getMe);

app.patch('/user/changeData', checkAuth, updateDataValidator, HandleValidationsErrors, AccountController.changeAccountData);
app.post('/user/checkPassword', checkAuth, checkPassword);

app.post('/session', checkAuth, SessionController.saveSession);
app.get('/account', checkAuth, AccountController.getAccountData);
app.get('/account/highlight', checkAuth, AccountController.getAccountDataHighlight);
app.get('/account/name', checkAuth, AccountController.getName);

app.listen(process.env.PORT || PORT, (err) => {
    if (err) {
        console.log(err)
    }
    console.log('Сервер работает на порту ' + PORT)
})