const mongoose = require("mongoose");

const DeviceDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  image: { type: Buffer, required: false }, // Store image as binary or use an external URL
  analogValue: { type: Number, required: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceData", DeviceDataSchema);
