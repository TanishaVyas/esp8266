const { MongoClient } = require("mongodb");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

// MongoDB Connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
const db = mongoClient.db("usersDB"); // Change to your database name
const deviceDataCollection = db.collection("deviceData");

// Start WebSocket Server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let connectedClients = [];

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("Client connected for real-time updates");
  connectedClients.push(ws);

  ws.on("close", () => {
    connectedClients = connectedClients.filter((client) => client !== ws);
  });
});

// Function to send real-time updates
const sendRealTimeUpdate = (message) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Watch MongoDB for changes
async function watchDatabase() {
  await mongoClient.connect();
  console.log("✅ Watching MongoDB for real-time updates...");

  const changeStream = deviceDataCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const newData = change.fullDocument;
      console.log("📌 New data inserted:", newData);

      // Send push update to WebSocket clients
      sendRealTimeUpdate({
        type: "NEW_DATA",
        deviceId: newData.deviceId,
        timestamp: newData.timestamp,
      });
    }
  });
}

// Start the watch function
watchDatabase().catch(console.error);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
