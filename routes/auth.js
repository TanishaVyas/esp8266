const express = require("express");
const bcrypt = require("bcryptjs"); // Change from bcrypt to bcryptjs
const jwt = require("jsonwebtoken");
const User = require("../models/Users"); // Adjust the path if needed

const router = express.Router();

// SIGNUP ROUTE with Unique Device ID Validation
router.post("/signup", async (req, res) => {
  const { name, email, password, deviceId } = req.body;

  try {
    // Check if passwords match
    //if (password !== confirmPassword) {
    //return res.status(400).json({ message: "Passwords do not match" });
    //}

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if device ID is already registered
    const existingDevice = await User.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ message: "Device ID already in use" });
    }
    console.log(deviceId);
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      deviceId,
    });
    console.log(newUser);
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup Error:", error); // Logs detailed error to console
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, device } = req.body;
  console.log("Login request received:", { email, device }); // Debug Log

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found:", email); // Debug Log
      return res.status(401).json({ message: "User not found" });
    }

    // CHECK IF PASSWORD MATCHES HASHED PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for user:", email); // Debug Log
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log(device);

    if (user.deviceId !== device) {
      console.log("Device ID mismatch for user:", email); // Debug Log
      return res.status(401).json({ message: "Device ID mismatch" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, device: user.deviceId },
      "your_secret_key",
      { expiresIn: "1h" }
    );

    console.log("Login successful for user:", email); // Debug Log
    res.json({ token, message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err); // Logs detailed error to console
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const user = await User.findById(decoded.id).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ name: user.name, email: user.email, deviceId: user.device });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
