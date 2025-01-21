const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = 5000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// PostgreSQL Client Setup
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'maruthi-sweets',
});

// Connect to PostgreSQL
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database:', err);
    process.exit(1); // Exit the process if unable to connect
  });

// Firebase Admin SDK Setup
admin.initializeApp({
  credential: admin.credential.cert(require('./maruthi-sweets-firebase-adminsdk-fbsvc-d36f81fe23.json')),
});

// Endpoint to create a new order and send a push notification
app.post('/api/orders', async (req, res) => {
  console.log('Request received:', req.body);

  const { name, contact, eventDescription, boxesRequired } = req.body;

  if (!name || !contact || !eventDescription || !boxesRequired) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Insert order into database
    const result = await client.query(
      'INSERT INTO orders (name, contact, event_description, boxes_required) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contact, eventDescription, boxesRequired]
    );
    console.log('Order successfully inserted:', result.rows[0]);

    // // Fetch seller's FCM token (example for later use)
    // const tokenResult = await client.query('SELECT fcm_token FROM seller_tokens LIMIT 1');
    // const sellerFcmToken = tokenResult.rows[0]?.fcm_token;

    // if (!sellerFcmToken) {
    //   console.warn('No FCM token found for the seller');
    //   return res.status(201).json({ 
    //     message: 'Order placed successfully, but no seller FCM token found',
    //     order: result.rows[0]
    //   });
    // }

    // // Send push notification
    // const message = {
    //   notification: {
    //     title: 'New Order Received',
    //     body: `${name} ordered ${boxesRequired} boxes for ${eventDescription}.`,
    //   },
    //   token: sellerFcmToken,
    // };

    // admin.messaging().send(message)
    //   .then((response) => {
    //     console.log('Successfully sent notification:', response);
    //   })
    //   .catch((error) => {
    //     console.error('Error sending notification:', error);
    //     if (error.code === 'messaging/registration-token-not-registered') {
    //       console.log('FCM token expired, removing from database');
    //       client.query('DELETE FROM seller_tokens WHERE fcm_token = $1', [sellerFcmToken]);
    //     }
    //   });

    res.status(201).json({ message: 'Order placed successfully', order: result.rows[0] });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// Endpoint to save FCM token
app.post('/api/save-token', async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ message: 'FCM Token is required' });
  }

  try {
    // Insert or update the FCM token in the database
    await client.query(
      'INSERT INTO seller_tokens (fcm_token) VALUES ($1) ON CONFLICT (fcm_token) DO NOTHING',
      [fcmToken]
    );
    res.status(200).json({ message: 'FCM Token saved successfully' });
  } catch (err) {
    console.error('Error saving FCM token:', err);
    res.status(500).json({ message: 'Failed to save FCM token' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Test database connection (optional, for debugging purposes)
client.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error testing database connection:', err);
  } else {
    console.log('Database connection test successful. Current time:', res.rows[0].now);
  }
});
