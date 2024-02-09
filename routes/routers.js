//EXTERNAL IMPORTS
const express = require('express');

//INTERNAL IMPORTS
const {
    addTrain,
    getBalance
} = require('../controllers/controllers');

const router = express.Router();

router.post('/trains', addTrain);


router.get('/wallets/:id', getBalance);

module.exports = router;