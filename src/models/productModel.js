const client = require("../config/db");

const createProduct = async (
  product_name,
  product_price,
  product_image_url,
  show_available
) => {
  const query = `
    INSERT INTO products (product_name, product_price, product_image_url, show_available)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;

  const values = [
    product_name,
    product_price,
    product_image_url,
    show_available,
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

const getAllProducts = async () => {
  const query = `
    SELECT *
    FROM products;
  `;
  const result = await client.query(query);
  return result.rows;
};

const getAvailableProducts = async () => {

  const query = `
    SELECT *
    FROM products
    WHERE show_available = $1;
  `;
  const values = [true];
  const result = await client.query(query, values);
  return result.rows;
};

const toggleProductAvailability = async (product_id, show_available) => {
    console.log("toggleProductAvailability----------------->", product_id, show_available);
  const query = `
    UPDATE products SET show_available = $1 WHERE product_id = $2 RETURNING *
  `;
  const values = [!show_available, product_id];
  const result = await client.query(query, values);
  return result.rows[0];
}

module.exports = { createProduct, getAllProducts, getAvailableProducts, toggleProductAvailability };
