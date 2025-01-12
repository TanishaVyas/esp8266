const express = require("express");
const cors = require("cors");
const sharp = require("sharp"); // For image compression

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Middleware to parse raw image data
app.use(express.raw({ type: "image/jpeg", limit: "10mb" }));

let latestImageBuffer = null; // To store the latest image data
let currentAnalogValue = null; // To store the latest analog value
let sseClients = []; // To store connected SSE clients

// SSE endpoint to send updates
app.get("/events", (req, res) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    res.flushHeaders();

    sseClients.push(res);

    // Remove client when they disconnect
    req.on("close", () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

// Function to send updates to all SSE clients
function sendUpdate(event, data) {
    sseClients.forEach(client => {
        client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
}

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

          function fetchLatestImage() {
            const img = document.getElementById("latest-image");
            img.src = "/latest-image?" + new Date().getTime(); // Prevent caching by adding a timestamp
          }

          setInterval(fetchLatestImage, 5000); // Fetch updates every 5 seconds
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
