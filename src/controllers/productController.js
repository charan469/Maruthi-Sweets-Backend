require("dotenv").config();
const {
  createProduct,
  getAllProducts,
  getAvailableProducts,
  toggleProductAvailability,
} = require("../models/productModel");
const client = require("../config/db");
const { DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");

// Configure AWS S3 Client (v3)
 const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadProductImage = async (req, res) => {
  console.log("📸 Image upload request received");

  if (!req.file) {
    console.log("❌ No file received in request body!");
    return res.status(400).json({ message: "No file uploaded." });
  }

  console.log("✅ File uploaded successfully:", req.file);

  res.json({ imageUrl: req.file.location });
};

const createNewProduct = async (req, res) => {
  try {
    const { product_name, product_price, product_image_url, show_available } =
      req.body;

    console.log("🛒 Creating new product:", req.body);

    // Check if the product already exists
    const checkQuery = `SELECT * FROM products WHERE product_name = $1`;
    const checkResult = await client.query(checkQuery, [product_name]);

    if (checkResult.rows.length > 0) {
      console.warn("⚠️ Product already exists:", product_name);
      return res.status(409).json({
        message: "Product already exists.",
        product: checkResult.rows[0],
      });
    }

    const product = await createProduct(
      product_name,
      product_price,
      product_image_url,
      show_available
    );
    console.log("✅ Product created successfully:", product);

    res.status(201).json({ message: "Product created successfully.", product });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ message: "Error creating product." });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    console.log("📦 Fetching all products...");
    const products = await getAllProducts();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};

const fetchAvailableProducts = async (req, res) => {
  try {
    console.log("📦 Fetching available products...");
    const products = await getAvailableProducts();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products." });
  }
};

const changeProductAvailability = async (req, res) => {
  try {
    const { product_id, newStatus } = req.body;
    console.log("🔄 Changing product availability:", req.body);

    const product = await toggleProductAvailability(product_id, newStatus);
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("❌ Error toggling product availability:", error);
    res.status(500).json({ message: "Error toggling product availability." });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { product_id, product_image_url } = req.body;
    console.log("🗑️ Deleting product:", product_id);

    if (product_image_url) {
      // Extract the S3 object key from the image URL
      const imageKey = product_image_url.split(".amazonaws.com/")[1];

      if (imageKey) {
        console.log("🗑️ Deleting image from S3:", imageKey);
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageKey,
        };

        await s3.send(new DeleteObjectCommand(deleteParams));
        console.log("✅ Image deleted from S3 successfully.");
      }
    }


    const query = `DELETE FROM products WHERE product_id = $1 RETURNING *`;
    const result = await client.query(query, [product_id]);

    if (result.rows.length === 0) {
      console.warn("⚠️ Product not found:", product_id);
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product." });
  }
};

module.exports = {
  uploadProductImage,
  createNewProduct,
  fetchAllProducts,
  fetchAvailableProducts,
  changeProductAvailability,
  deleteProduct,
};
