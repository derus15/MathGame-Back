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

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

},
    {
        timestamps: true,
    })

export default mongoose.model('Session', SessionSchema)