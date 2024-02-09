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

userSchema.methods.decreaseBalance = async function(amountPromise) {
    try {
        // Wait for the amount promise to resolve
        const amount = await amountPromise;
        
        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }
        
        this.balance -= amount;
        await this.save();
    } catch (error) {
        throw error;
    }
};


const User = mongoose.model('User', userSchema);

module.exports = User;