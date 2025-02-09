const { getOrCreateSellerToken } = require("../models/sellerModel");

const saveSellerToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM Token is required" });
    }

    const result = await getOrCreateSellerToken(fcmToken);

    if (result.rowCount > 0) {
      return res.status(201).json({ message: "FCM Token saved successfully", token: result.rows[0] });
    } else {
      return res.status(200).json({ message: "Token already exists, no new row inserted." });
    }
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({ message: "Failed to save FCM token" });
  }
};

module.exports = { saveSellerToken };
