const { createProduct, getAllProducts, getAvailableProducts, toggleProductAvailability } = require("../models/productModel");
const client = require("../config/db");

const createNewProduct = async (req, res) => {
  try {
    const { product_name, product_price, product_image_url, show_available } = req.body;
     // Check if the product already exists
     const checkQuery = `SELECT * FROM products WHERE product_name = $1`;
     const checkResult = await client.query(checkQuery, [product_name]);
 
     if (checkResult.rows.length > 0) {
       return res.status(409).json({ // 409 Conflict: Resource already exists
         message: "Product already exists.",
         product: checkResult.rows[0]
       });
     }
    const product = await createProduct(product_name, product_price, product_image_url, show_available);
    res.status(201).json({ message: "Product created successfully.", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product." });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    console.log("Fetching all products");
    const products = await getAllProducts();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};

const fetchAvailableProducts = async (req, res) => {
  try {
    const products = await getAvailableProducts();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};

const changeProductAvailability = async (req, res) => {
    try {
      //  const { product_id } = req.params;
      console.log("req.body----------------", req.body);
  const { product_id, show_available } = req.body;
      const product = await toggleProductAvailability(product_id, show_available);
    //   res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
      console.error("Error toggling product availability:", error);
      res.status(500).json({ message: "Error toggling product availability." });
    }
  };

  const deleteProduct = async (req, res) => {
    try {
      const { product_id } = req.body;
      console.log("req.body----------------", req.body);
      console.log("product_id--------------------", product_id);
      const query = `DELETE FROM products WHERE product_id = $1 RETURNING *`;
      const result = await client.query(query, [product_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product." });
  }
}

module.exports = { createNewProduct, fetchAllProducts, fetchAvailableProducts, changeProductAvailability, deleteProduct };
