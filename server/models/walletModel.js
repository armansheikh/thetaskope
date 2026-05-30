const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "Please provide a wallet address"],
    unique: true,
    lowercase: true,
  },
  provider: {
    type: String,
    default: "MetaMask",
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Wallet", walletSchema);

