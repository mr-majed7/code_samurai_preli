const express = require('express');
const Users = require("../models/Users");
const {addUser} = require("../controllers/controllers")


const router = express.Router();

router.post("/",addUser)

module.exports = router;