//EXTERNAL IMPORTS
const express = require('express');
const Stations = require('../models/Stations');
const {addStation, allStation,allTrains} = require("../controllers/controllers")


const router = express.Router();

router.post("/", addStation)

router.get("/", allStation)

router.get('/:station_id/trains', allTrains)

module.exports = router;
