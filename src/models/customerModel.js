const client = require("../config/db");

const getOrCreateCustomer = async (customerName, mobileNumber) => {
  const query = `SELECT customer_id FROM customers WHERE mobile_number = $1`;
  const values = [mobileNumber];
  customerResult = await client.query(query, values);
  let customerId;
  if (customerResult.rows.length > 0) {
    customerId = customerResult.rows[0].customer_id;
  } else {
    const query = `INSERT INTO customers (name, mobile_number) VALUES ($1, $2) RETURNING customer_id`;
    const values = [customerName, mobileNumber];
    const newCustomerResult = await client.query(query, values);
    customerId = newCustomerResult.rows[0].customer_id;
  }
  return customerId;
};

module.exports = { getOrCreateCustomer };
