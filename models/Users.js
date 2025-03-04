const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  deviceId: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema, "Users"); // Explicitly use "Users"
