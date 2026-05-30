const Wallet = require('../models/walletModel');
const { ethers } = require('ethers');

exports.saveWallet = async (req, res) => {
    try {
        const { address, signature, message } = req.body;

        if (!address || !signature || !message) {
            return res.status(400).json({ success: false, message: "Address, signature, and message are required" });
        }

        let recoveredAddress;
        try {
            recoveredAddress = ethers.utils.verifyMessage(message, signature);
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid signature format" });
        }

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ success: false, message: "Signature verification failed" });
        }

        let wallet = await Wallet.findOneAndUpdate(
            { address: address.toLowerCase() },
            { $set: { lastActive: Date.now() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Wallet authenticated and saved successfully",
            wallet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
