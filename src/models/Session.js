import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({

    sign: {
        type: Array,
        require: true,
    },

    mode: {
        type: String,
        require: true,
    },

    time: {
        type: Number,
    },

    number: {
        type: Number,
    },

    rounds: {
        type: Number,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    eps: {
        type: String,
    },

    modifications: {
        type: Array,
    },

    unexpectedEnd: {
        type: Boolean,
    }

},
    {
        timestamps: true,
    })

export default mongoose.model('Session', SessionSchema)