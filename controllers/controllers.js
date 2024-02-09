const Train = require('../models/Trains');
const User = require('../models/Users');
const Station = require('../models/Stations');

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
        const user = await User.findOne({user_id: req.params.id});
       if (!user) {
           const error = new Error(`wallet with id ${req.params.id} was not found`);
            error.status = 404;
            throw error;

       }else{
              res.status(200).json({
               "waller_id": user.user_id,
                "balance": user.balance,
                "wallet_user":
                {
                    "user_id": user.user_id,
                    "user_name": user.user_name

                }
              });
       }
    } catch (error) {
        next(error);
    }
}

async function addBalance(req, res, next) {
    try {
        const user = await User.findOne({user_id: req.params.id});
        if (!user) {
            const error = new Error(`wallet with id: ${req.params.id} was not found`);
            error.status = 404;
            throw error;
        }else if (req.body.recharge < 100 || req.body.recharge > 10000) {
            const error = new Error(`"invalid amount: ${req.body.recharge}`);
            error.status = 400;
            throw error;
        }else{
            user.balance += req.body.recharge;
            const result = await user.save();
            res.status(200).json({
                "wallet_id": result.user_id,
                "wallet_balance": result.balance,
                "wallet_user":
                {
                    "user_id": result.user_id,
                    "user_name": result.user_name
                }
            });
        }
    }catch (error) {
        next(error);
    }
}

async function purchaseTicket(req, res, next) {
    try {
        const { wallet_id, time_after, station_from, station_to } = req.body;
        const user = await User.findOne({ user_id: wallet_id });
        const userBalance = user.balance;
        const [hours, minutes] = time_after.split(':').map(Number);
    
        const totalMinutesAfter = hours * 60 + minutes;
    
        const trains = await Train.find({
          'stops.station_id': { $all: [station_from, station_to] }
        }).populate('stops', 'station_id departure_time fare -_id').sort('stops.departure_time');
    
        const availableTrains = trains.filter(train =>
          train.stops.some(stop =>
            stop.station_id === station_from &&
            minutesAfter(stop.departure_time) > totalMinutesAfter
          )
        );
    
        if (availableTrains.length === 0) {
            const error = new Error(`"no ticket available for station: ${station_from} to station:${station_to}`);
            error.status = 403;
            throw error;
        }
        const selectedTrain = availableTrains[0];
        let totalFare = 0;
        let foundStartStation = false;
    
        for (const stop of selectedTrain.stops) {
          if (stop.station_id === station_from) {
            foundStartStation = true;
          }
    
          if (foundStartStation) {
            totalFare += stop.fare;
    
            if (stop.station_id === station_to) {
              break;
            }
          }
        }
    
        if (userBalance < totalFare) {
          const amountShort = totalFare - userBalance;
          const erro = new Error(`recharge amount: ${amountShort} to purchase the ticket`)
          erro.status = 402;
          throw erro;
        }
    
        const updatedBalance = userBalance - totalFare;
    
        const stations = selectedTrain.stops.reduce((acc, stop) => {
          if (stop.station_id === station_from || stop.station_id === station_to) {
            acc.push({
              station_id: stop.station_id,
              train_id: selectedTrain.train_id,
              departure_time: stop.departure_time || null,
              arrival_time: stop.station_id === station_to ? stop.arrival_time || null : null
            });
          }
          return acc;
        }, []);
    
        const ticket_id = Math.floor(Math.random() * 1000000);
    
        res.status(200).json({ ticket_id, balance: updatedBalance, wallet_id, stations });
      } catch (error) {
        next(error);
      }
}

function minutesAfter(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

const addUser = async(req, res)=> {
    try {
        const newUser = new Users(req.body)
        await newUser.save()
        res.status(201).json(newUser)
    }catch (error) {
        next(error);
    }
}

const addStation = async(req, res)=> {
    try{
        const newStation = new Station(req.body)
        await newStation.save()
        res.status(201).json(newStation)
    }catch (error) {
        next(error);
    }
}

const allStation = async(req, res)=> {
    try{
        const allStat = await Station.find({})
        res.status(200).json({stations: allStat})
    }catch (error) {    
        next(error);
    }
}
 
async function allTrains(req,res,next){
    try {
        const station  = await Station.findOne({station_id: req.params.station_id});
        if (!station) {
            const error = new Error(`station with id: ${req.params.station_id} was not found`);
            error.status = 404;
            throw error;
        }else{
            const stationId = parseInt(req.params.station_id);
        const allTrains = await Train.find().populate('stops', 'station_id arrival_time departure_time -_id');
    
        const trainsAtStation = allTrains.reduce((acc, train) => {
          const stop = train.stops.find(stop => stop.station_id === stationId);
          if (stop) {
            acc.push({
              train_id: train.train_id,
              arrival_time: stop.arrival_time || null,
              departure_time: stop.departure_time || null
            });
          }
          return acc;
        }, []);
    
        if (trainsAtStation.length === 0) {
          return res.status(200).json({ station_id: stationId, trains: [] });
        }
        trainsAtStation.sort((a, b) => {
          if (a.departure_time === b.departure_time) {
            if (!a.arrival_time && !b.arrival_time) {
              return a.train_id - b.train_id;
            } else if (!a.arrival_time) {
              return -1;
            } else if (!b.arrival_time) {
              return 1;
            } else {
              return a.arrival_time.localeCompare(b.arrival_time) || a.train_id - b.train_id;
            }
          } else {
            return a.departure_time.localeCompare(b.departure_time) || a.train_id - b.train_id;
          }
        });
    
        res.status(200).json({ station_id: stationId, trains: trainsAtStation });
        }
      } catch (error) {
        next(error);        
      }
}
    

module.exports = {
    addTrain,
    getBalance,
    addBalance,
    purchaseTicket,
    addUser,
    addStation,
    allStation,
    allTrains,
    purchaseTicket
}

