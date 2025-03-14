const path = require("path");
const { fileURLToPath } = require("url");

const express = require("express");
const cors = require("cors");
const sharp = require("sharp"); // For image compression
const mongoose = require("./db");
const DeviceData = require("./models/DeviceData");
const users = require("./models/Users");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");
const webpush = require("web-push");
const bodyParser = require("body-parser");

//const _filename = fileURLToPath(import.meta.url);
//const _dirname = path.dirname(_filename);
const _dirname = path.resolve();

require("dotenv").config();
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
// Allow frontend to connect (Change PORT if needed)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001"; // Adjust frontend port if needed
const PORT = process.env.PORT || 3000;

// Apply CORS middleware once
app.use(cors());
app.use(express.json()); // Ensure JSON parsing is enabled
app.use(bodyParser.json());

// Connect to MongoDB before starting server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log("📌 Connected to Database:", mongoose.connection.name);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1); // Exit if DB connection fails
  });

app.use(cors());
// Middleware to parse raw image data
app.use(express.raw({ type: "image/jpeg", limit: "10mb" }));

app.get("/test-connection", (req, res) => {
  res.json({ message: "Middleware is connected to frontend!" });
});

app.use("/auth", authRoutes);
app.use("/storage", imageRoutes);

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], "your_secret_key"); // Extract token from "Bearer <token>"
    req.user = decoded; // Attach user details to request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

let latestImageBuffer = null; // To store the latest image data
let currentAnalogValue = null; // To store the latest analog value
let sseClients = []; // To store connected SSE clients

// SSE endpoint to send updates
app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  sseClients.push(res);

  // Remove client when they disconnect
  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// Function to send updates to all SSE clients
function sendUpdate(event, data) {
  sseClients.forEach((client) => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload/:deviceId", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file received" });
  }

  try {
    // Convert file buffer to Base64
    const base64Image = req.file.buffer.toString("base64");

    // Save to MongoDB
    const newImage = new DeviceData({
      deviceId: req.params.deviceId, // Get deviceId from URL
      image: base64Image, // Store as Base64
      timestamp: new Date(),
    });

    await newImage.save();
    res.status(200).json({ message: "Image uploaded and saved to DB" });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ message: "Error processing image" });
  }
});

/*
// Endpoint to receive image upload
app.post("/upload", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No image data received");
  }

  // Compress the image to reduce size
  sharp(req.body)
    .resize(640, 480) // Resize image to a manageable size (optional)
    .jpeg({ quality: 80 }) // Compress the image to 80% quality (optional)
    .toBuffer((err, buffer) => {
      if (err) {
        return res.status(500).send("Error processing image");
      }

      latestImageBuffer = buffer; // Store the compressed image in memory
      console.log("Image received and stored in memory");

      // Notify clients of the updated image
      sendUpdate("image", { url: "/latest-image?" + new Date().getTime() });

      res.status(200).send("Image received and stored in memory");
    });
});



// Endpoint to receive analog value
app.post("/analog", express.json(), (req, res) => {
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).send("No analog value received");
  }

  currentAnalogValue = value; // Store the latest analog value
  console.log("Analog value received:", currentAnalogValue);

  // Notify clients of the updated analog value
  sendUpdate("analog", { value: currentAnalogValue });

  res.status(200).send("Analog value updated");
});

// Endpoint to serve the latest image
app.get("/latest-image", (req, res) => {
  if (!latestImageBuffer) {
    return res.status(404).send("No image uploaded yet");
  }

  res.set("Content-Type", "image/jpeg");
  res.send(latestImageBuffer);
});

*/

let currentAnalogValues = {}; // Store latest analog values for each device

app.post("/analog/:deviceId", express.json(), (req, res) => {
  const { value } = req.body;
  const deviceId = req.params.deviceId; // Extract deviceId from URL

  if (value === undefined) {
    return res.status(400).send("No analog value received");
  }

  // Store latest value per device
  currentAnalogValues[deviceId] = value;
  console.log(`Analog value received from ${deviceId}:`, value);

  // Notify frontend of update
  sendUpdate("analog", { deviceId, value });

  res.status(200).send("Analog value updated");
});

// Endpoint to get the latest analog value for a specific device
app.get("/analog/:deviceId", (req, res) => {
  const deviceId = req.params.deviceId;

  if (!(deviceId in currentAnalogValues)) {
    return res.status(404).send("No analog value received yet for this device");
  }

  res.json({ deviceId, value: currentAnalogValues[deviceId] });
});

// Webpage to display the latest image and analog value
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>ESP32-CAM Image Viewer</title>
        <script>
          const eventSource = new EventSource('/events');

          eventSource.addEventListener('analog', (event) => {
            const data = JSON.parse(event.data);
            document.getElementById('analog-value').innerText = "Analog Value: " + data.value;
          });

          eventSource.addEventListener('image', (event) => {
            const data = JSON.parse(event.data);
            const img = document.getElementById("latest-image");
            img.src = data.url; // Update the image source with the new URL
          });
        </script>
      </head>
      <body>
        <h1>ESP32-CAM Image Viewer</h1>
        ${
          latestImageBuffer
            ? `<img id="latest-image" src="/latest-image" alt="Captured Image" style="max-width: 100%;"/>`
            : "<p>No image uploaded yet</p>"
        }
        <h2 id="analog-value">Analog Value: Not Available</h2>
      </body>
    </html>
  `);
});

// ✅ **WebSocket Setup**
const wss = new WebSocket.Server({ server });

let connectedClients = [];

// 🔹 **WebSocket Connection Handling**
wss.on("connection", (ws) => {
  console.log("🟢 Client connected for real-time updates");
  connectedClients.push(ws);

  ws.on("close", () => {
    connectedClients = connectedClients.filter((client) => client !== ws);
  });
});

// 🔹 **Function to send real-time updates**
const sendRealTimeUpdate = (message) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

const SubscriptionSchema = new mongoose.Schema({
  deviceId: String, // Store the user's device ID
  endpoint: String,
  keys: Object,
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

// Web Push Config
const publicVapidKey =
  "BNG2BDTAu1qPmRWI5kXH2KyJR10rzQLltb6h7kBwm5OcmvoU7NToKfR5vwVk6C3yBneNC4Oojfl2Ug_gtuOg68I";
const privateVapidKey = "OPoDhj5n5NsdTIIrLCuZFuhyzJG2wrpzhNdcmgTfVGU";

webpush.setVapidDetails(
  "mailto:tanisha.vyas.btech2022@sitpune.edu.in",
  publicVapidKey,
  privateVapidKey
);

// ✅ Route: Save Subscription
app.post("/subscribe", async (req, res) => {
  const { deviceId, endpoint, keys } = req.body;

  // Check if subscription already exists for this deviceId
  let existingSub = await Subscription.findOne({ deviceId });
  if (!existingSub) {
    const subscription = new Subscription({ deviceId, endpoint, keys });
    await subscription.save();
  }

  res.status(201).json({ message: "Subscription saved!" });
});

// ✅ Route: Send Push Notification
app.post("/send-notification", async (req, res) => {
  const { deviceId, title, message } = req.body;

  // Find subscriptions matching the deviceId
  const subscriptions = await Subscription.find({ deviceId });

  const payload = JSON.stringify({ title, message });

  // Send push notifications only to users with the matching deviceId
  subscriptions.forEach((sub) => {
    webpush.sendNotification(sub, payload).catch((err) => console.error(err));
  });

  res.status(200).json({ message: "Push notifications sent!" });
});

app.post("/add-data", async (req, res) => {
  try {
    const { deviceId, someOtherField } = req.body; // Get data from request

    // ✅ Store new data in MongoDB
    const newData = new DeviceData({ deviceId, someOtherField });
    await newData.save();

    // ✅ Send push notification ONLY to users with the same deviceId
    await fetch("http://smart-box.onrender.com/send-notification", {
      method: "POST",
      body: JSON.stringify({
        deviceId,
        title: "New Data Added!",
        message: `A new record for Device ID ${deviceId} has been stored.`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    res.status(201).json({ message: "Data saved & notification sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save data" });
  }
});
