//EXTERNAL IMPORTS
const express = require('express');
const {addStation, allStation} = require("../controllers/controllers")


const router = express.Router();

router.post("/", addStation)

router.get("/", allStation)

module.exports = router;
