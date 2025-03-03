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

//const _filename = fileURLToPath(import.meta.url);
//const _dirname = path.dirname(_filename);
const _dirname = path.resolve();

require("dotenv").config();
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
const app = express();

// Allow frontend to connect (Change PORT if needed)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001"; // Adjust frontend port if needed
const PORT = process.env.PORT || 3000;

// Apply CORS middleware once
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json()); // Ensure JSON parsing is enabled

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

app.use(express.static(path.join(_dirname, "/client/build")));
app.get("*", (req, res) => res.sendFile(path.join(_dirname, "/client/build")));

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
    return res.status(400).json({ message: "No image uploaded" });
  }

  try {
    // Compress and store image as Buffer (binary)
    const compressedImage = await sharp(req.file.buffer)
      .resize(640, 480)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Save to MongoDB
    const newImage = new DeviceData({
      deviceId: deviceId, // Change this dynamically if needed
      image: compressedImage, // Store binary data
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

*/

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
