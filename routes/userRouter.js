const express = require('express');
const Users = require("../models/Users");


const router = express.Router();

router.post("/",async(req ,res, next)=> {
    const newUser = new Users(req.body)
    await newUser.save()
    res.status(201).json(newUser)
})

module.exports = router;