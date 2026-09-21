'use strict';

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI 
  try {
    console.log(`[db] Connecting to MongoDB -> ${uri}`);
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected -> ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection error:", err.message);
    console.error(
      "[db] Is MongoDB running? For the POC you can start a local instance or point MONGO_URI at Atlas."
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });
}

module.exports = connectDB;
