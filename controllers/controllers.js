const Train = require('../models/Trains');
const User = require('../models/Users');

async function addTrain(req, res,next){
    try {
        const train = new Train(req.body);
        const result = await train.save();
        const stops = result.stops;
        const length = stops.length;
        console.log(length)
        res.status(201).json({
            "train_id": result.train_id,
            "train_name": result.train_name,
            "capacity": result.capacity,
            "service_starts": result.stops[0].departure_time,
            "service_ends": result.stops[length-1].arrival_time,
            "num_station": length
        });
    } catch (error) {
        next(error);
    }
}

async function getBalance(req, res, next) {
    try {
        const user = await User.findOne({user_id: req.params.uid});
       if (!user) {
           const error = new Error(`wallet with id ${req.params.id} was not found`);
       }else{
              res.status(200).json({
                "user_id": user.user_id,
                "balance": user.balance
              });
       }
    } catch (error) {
        next(error);
    }
}

module.exports = {
    addTrain,
    getBalance
}