//EXTERNAL IMPORTS
const express = require('express');


const router = express.Router();

router.post("/", async( req,res, next)=> {
    const newStation = new Stations(req.body)
    await newStation.save() 
    res.send(201).json(newStation)
})

module.exports = router;