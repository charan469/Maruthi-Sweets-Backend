const fetch = require("node-fetch");
const client = require("../config/db");

const sendPushNotification = async (customerName, order) => {
  const tokenResult = await client.query("SELECT fcm_token FROM seller_tokens");

  const sellerExpoPushTokens = tokenResult.rows
    .map((row) => row.fcm_token)
    .filter((token) => token);

  if (sellerExpoPushTokens.length === 0) {
    console.warn("No Expo Push Tokens found for sellers");
    return;
  }

  // Creating an array of notification messages for multiple tokens
  const messages = sellerExpoPushTokens.map((token) => ({
    to: token,
    sound: "default",
    title: "New Order Received",
    body: `${customerName} placed an order. Please check the order.`,
    data: { order },
  }));

  // Sending the notifications in a batch request
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages), // Send an array of messages
  });

  const responseData = await response.json();
  if (responseData.errors) {
    console.error("Error sending notifications:", responseData.errors);
  } else {
    console.log("Successfully sent notifications to sellers.", responseData);
  }
};

module.exports = { sendPushNotification };
