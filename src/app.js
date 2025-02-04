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
  host: "maruthi-sweets-db-instance.cbs6smg2gtgw.ap-south-1.rds.amazonaws.com",
  port: 5432,
  user: "charan",
  password: "MARUTHIsweets#01",
  database: "maruthi_sweets_db",
  ssl: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
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
  const { cartItems, deliveryDetails, totalPrice, orderDate } = req.body;
  const { customerName, mobileNumber, city, deliveryPoint, deliveryDate } =
    deliveryDetails;
  // if (!name || !contact || !eventDescription || !boxesRequired) {
  //   return res.status(400).json({ message: "All fields are required" });
  // }

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Check if the customer already exists
    const customerResult = await client.query(
      "SELECT customer_id FROM customers WHERE mobile_number = $1",
      [mobileNumber]
    );

    let customerId;
    if (customerResult.rows.length > 0) {
      // Customer already exists, get the customer_id
      customerId = customerResult.rows[0].customer_id;
    } else {
      // Insert new customer
      const newCustomerResult = await client.query(
        "INSERT INTO customers (name, mobile_number) VALUES ($1, $2) RETURNING customer_id",
        [customerName, mobileNumber]
      );
      customerId = newCustomerResult.rows[0].customer_id;
    }

    // Insert order details
    const orderResult = await client.query(
      `
      INSERT INTO orders (customer_id, order_date, delivery_date, city, delivery_point, total_price, cart_items)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
      `,
      [
        customerId,
        orderDate,
        deliveryDate,
        city,
        deliveryPoint,
        totalPrice,
        JSON.stringify(cartItems),
      ]
    );
    console.log("Order successfully inserted:", orderResult.rows[0]);

    // Commit transaction
    await client.query("COMMIT");

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
      body: `${customerName} placed an order please check the order.`,
      data: { order: orderResult.rows[0] },
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

    res.status(201).json({
      message: "Order placed successfully.",
      order: orderResult.rows[0],
    });
  } catch (error) {
    // Rollback transaction in case of error
    await client.query("ROLLBACK");
    console.error("Error saving order:", error);
    res.status(500).json({ message: "Error saving order." });
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

// Endpoint to get all orders
app.get("/api/get-all-orders", async (req, res) => {
  console.log("Request received: Get all orders", req);
  try {
    const query = `
    SELECT 
    o.order_id,
    o.customer_id,
    o.order_date,
    o.delivery_date,
    o.city,
    o.delivery_point,
    o.total_price,
    o.cart_items,
    c.name,
    c.mobile_number
    FROM
    orders o
     INNER JOIN 
     customers c
     ON 
     o.customer_id = c.customer_id;
    `;
    const result = await client.query(query);
    console.log("Orders fetched successfully:", result.rows);
    res.setHeader("Cache-Control", "no-store"); // Disable caching
    console.log(res.getHeaders());
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
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
