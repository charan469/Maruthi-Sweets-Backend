const fetch = require("node-fetch");
const client = require("../config/db");

const sendPushNotification = async (customerName, order) => {
  const tokenResult = await client.query(
    "SELECT fcm_token FROM seller_tokens LIMIT 1"
  );
  const sellerExpoPushToken = tokenResult.rows[0]?.fcm_token;

  if (!sellerExpoPushToken) {
    console.warn("No Expo Push Token found for the seller");
    return;
  }

  const message = {
    to: sellerExpoPushToken,
    sound: "default",
    title: "New Order Received",
    body: `${customerName} placed an order. Please check the order.`,
    data: { order },
  };

  const response = await fetch(process.env.EXPO_PUSH_API, {
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
};

module.exports = { sendPushNotification };
