const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;; // Fixed port for local testing
let currentSensorValue = 0;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded data

// Endpoint to receive sensor data
app.post('/sensor-data', (req, res) => {
    const { value } = req.body; // The value from the POST request

    // Assuming value is a string, we can convert it to a number if necessary
    currentSensorValue = Number(value);

    console.log(`Received sensor value: ${currentSensorValue}`);

    // Emit the sensor value to all connected clients
    io.emit('sensor-update', currentSensorValue);

    // Send a response back
    res.status(200).send("Data received");
});

// Serve the HTML page with real-time updates
app.get('/', (req, res) => {
    res.send(`
    <html>
      <body>
        <h1>Current Sensor Value:</h1>
        <p id="sensor-value">${currentSensorValue}</p>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          socket.on('sensor-update', (value) => {
            document.getElementById("sensor-value").innerText = value;
          });
        </script>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});