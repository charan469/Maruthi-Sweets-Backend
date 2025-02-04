const client = require("../config/db");

const createOrder = async (customerId, orderData) => {
  const {
    orderDate,
    deliveryDate,
    city,
    deliveryPoint,
    totalPrice,
    cartItems,
    orderStatus,
  } = orderData;

  const query = `
    INSERT INTO orders (customer_id, order_date, delivery_date, city, delivery_point, total_price, cart_items, order_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
  `;

  const values = [
    customerId,
    orderDate,
    deliveryDate,
    city,
    deliveryPoint,
    totalPrice,
    JSON.stringify(cartItems),
    orderStatus,
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

const getAllOrders = async () => {
  const query = `
    SELECT o.*, c.name, c.mobile_number
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id;
  `;
  const result = await client.query(query);
  return result.rows;
};

const getCustomerOrders = async (mobileNumber) => {
  const query = `
    SELECT o.*, c.name, c.mobile_number
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    WHERE c.mobile_number = $1;
  `;
  const values=[mobileNumber];
  const result = await client.query(query,values);
  return result.rows;
};

const changeOrderStatusModel = async (order_id, order_status) => {
  console.log("change order status----------------->", order_id, order_status);
const query = `
  UPDATE orders SET order_status = $1 WHERE order_id = $2 RETURNING *
`;
const values = [order_status, order_id];
const result = await client.query(query, values);
return result.rows[0];
}

module.exports = { createOrder, getAllOrders, getCustomerOrders, changeOrderStatusModel };
