const client = require("../config/db");

const getOrCreateSellerToken = async (fcmToken) => {
  const query = `
    INSERT INTO seller_tokens (fcm_token) 
    VALUES ($1) 
    ON CONFLICT (fcm_token) DO UPDATE 
    SET fcm_token = EXCLUDED.fcm_token 
    RETURNING *;
  `;

  return client.query(query, [fcmToken]); 
};

module.exports = { getOrCreateSellerToken };
