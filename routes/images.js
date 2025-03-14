const express = require("express");
const router = express.Router();
const DeviceData = require("../models/DeviceData");
const jwt = require("jsonwebtoken");

router.get("/images", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Get token from headers
    const decoded = jwt.verify(token, "your_secret_key"); // Verify token
    const deviceId = decoded.device; // Extract device ID from token

    console.log(`Fetching images for deviceId: ${deviceId}`);

    const images = await DeviceData.find({ deviceId });

    if (!images.length) {
      return res
        .status(404)
        .json({ message: "No images found for this device" });
    }

    // Convert Buffer to Base64
    const formattedImages = images.map((img) => ({
      image: img.image.toString("base64"), // Convert buffer to base64
      timestamp: img.timestamp,
    }));

    res.json(formattedImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/latest-image", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "your_secret_key");
    const deviceId = decoded.device;

    console.log(`Fetching latest image for deviceId: ${deviceId}`);

    const latestImage = await DeviceData.findOne({ deviceId })
      .sort({ timestamp: -1 }) // Get the most recent image
      .limit(1);

    if (!latestImage) {
      return res.status(404).json({ message: "No images found" });
    }

    res.json({
      image: latestImage.image.toString("base64"), , // Convert Buffer to Base64
      timestamp: latestImage.timestamp,
    });
  } catch (error) {
    console.error("Error fetching latest image:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
