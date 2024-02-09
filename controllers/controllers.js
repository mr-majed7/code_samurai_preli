
const Users = require("../models/Users")
const Station = require("../models/Stations")



const addUser = async(req, res)=> {
    const newUser = new Users(req.body)
    await newUser.save()
    res.status(201).json(newUser)
}
const addStation = async(req, res)=> {
    const newStation = new Station(req.body)
    await newStation.save()
    res.status(201).json(newStation)

}

const allStation = async(req, res)=> {
    const allStat = await Station.find({})
    res.status(200).json({stations: allStat})
}


module.exports = {addUser, addStation, allStation}