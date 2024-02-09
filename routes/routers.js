//EXTERNAL IMPORTS
const express = require('express');

//INTERNAL IMPORTS
const {
    addTrain,
    getBalance,
    addBalance,
    purchaseTicket
} = require('../controllers/controllers');

const router = express.Router();

router.post('/trains', addTrain);


router.get('/wallets/:id', getBalance);
router.put('/wallets/:id', addBalance);

router.post('/tickets', purchaseTicket);

module.exports = router;