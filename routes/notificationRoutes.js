const express = require("express");
const router = express.Router();
const admin = require("../firebase-admin");
const User = require("../models/Users");

router.post("/save-token", async (req, res) => {
  const { token, deviceId } = req.body;

  if (!token || !deviceId) {
    return res.status(400).json({ message: "Missing token or deviceId" });
  }
  console.log("Recieved the fcm on server");
  try {
    const user = await User.findOneAndUpdate(
      { deviceId },
      { $set: { fcmToken: token } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found with deviceId" });
    }

    console.log("Saved FCM token for user:", user.email);
    res.status(200).json({ message: "FCM token saved to user" });
  } catch (err) {
    console.error("Error saving FCM token:", err);
    res.status(500).json({ message: "Server error saving token" });
  }
});

// Send notification to a specific device (single token)
router.post("/send-notification", async (req, res) => {
  const { title = "Default Title", body = "Default Body", deviceId } = req.body;
  console.log("tile: ", title, deviceId, body);

  try {
    // Find the user's FCM token based on deviceId
    const user = await User.findOne({ deviceId });

    if (!user || !user.fcmToken) {
      return res
        .status(400)
        .json({ message: "User not found or FCM token not available" });
    }

    const fcmToken = user.fcmToken;

    // Prepare the notification message
    const message = {
      notification: {
        title,
        body,
      },
      token: fcmToken, // Send to a specific device using the token
    };
    console.log("messsageeeeee", message);
    // Send notification to the specified device
    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

module.exports = router;
