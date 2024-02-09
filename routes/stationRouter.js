//EXTERNAL IMPORTS
const express = require('express');
const {addStation} = require("../controllers/controllers")


const router = express.Router();

router.post("/", addStation)

module.exports = router;
