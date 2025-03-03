const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;

mongoose.connection.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  // Check the current database name
  console.log("📌 Using Database:", mongoose.connection.db.databaseName);

  // Check if the `users` collection exists
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(
    "📌 Available Collections:",
    collections.map((c) => c.name)
  );
});

module.exports = mongoose;
