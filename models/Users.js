const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true
    },
    user_name: {
        type: String,
        required: true
    },
    balance:{
        type: Number,
        required: true
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;