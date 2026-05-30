const express = require('express');
const { saveWallet } = require('../controllers/walletController');

const router = express.Router();

router.post('/wallet', saveWallet);

module.exports = router;
