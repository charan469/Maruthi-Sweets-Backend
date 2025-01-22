const express = require("express");
const { Client } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch"); // For sending push notifications to Expo API

const app = express();
const port = 5000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// PostgreSQL Client Setup
const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "maruthi-sweets",
});

// Connect to PostgreSQL
client
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => {
    console.error("Failed to connect to PostgreSQL database:", err);
    process.exit(1); // Exit the process if unable to connect
  });

// Endpoint to create a new order and send a push notification
app.post("/api/orders", async (req, res) => {
  console.log("Request received:", req.body);

  const { name, contact, eventDescription, boxesRequired } = req.body;

  if (!name || !contact || !eventDescription || !boxesRequired) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Insert order into the database
    const result = await client.query(
      "INSERT INTO orders (name, contact, event_description, boxes_required) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, contact, eventDescription, boxesRequired]
    );
    console.log("Order successfully inserted:", result.rows[0]);

    // Fetch seller's Expo Push Token from the database
    const tokenResult = await client.query(
      "SELECT fcm_token FROM seller_tokens LIMIT 1"
    );
    const sellerExpoPushToken = tokenResult.rows[0]?.fcm_token;
    console.log("sellerExpoPushToken", sellerExpoPushToken);
    if (!sellerExpoPushToken) {
      console.warn("No Expo Push Token found for the seller");
      return res.status(201).json({
        message:
          "Order placed successfully, but no seller Expo push token found",
        order: result.rows[0],
      });
    }
//const sellerExpoPushToken = "ExponentPushToken[zKC2vKOvLA_1SsCGrDhxL3]"
    // Send push notification to the seller via Expo Push Notification API
    const message = {
      to: sellerExpoPushToken, // Expo push token of the seller
      sound: "default",
      title: "New Order Received",
      body: `${name} ordered ${boxesRequired} boxes for ${eventDescription}.`,
      data: { order: result.rows[0] },
    };

    // Send the push notification using Expo Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    if (responseData.errors) {
      console.error("Error sending notification:", responseData.errors);
    } else {
      console.log("Successfully sent notification to seller.");
    }

    res
      .status(201)
      .json({ message: "Order placed successfully", order: result.rows[0] });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

// Endpoint to save FCM token
app.post("/api/save-token", async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ message: "FCM Token is required" });
  }

  try {
    // Insert or update the FCM token in the database
    await client.query(
      "INSERT INTO seller_tokens (fcm_token) VALUES ($1) ON CONFLICT (fcm_token) DO NOTHING",
      [fcmToken]
    );
    res.status(200).json({ message: "FCM Token saved successfully" });
  } catch (err) {
    console.error("Error saving FCM token:", err);
    res.status(500).json({ message: "Failed to save FCM token" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Test database connection (optional, for debugging purposes)
client.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error testing database connection:", err);
  } else {
    console.log(
      "Database connection test successful. Current time:",
      res.rows[0].now
    );
  }
});
