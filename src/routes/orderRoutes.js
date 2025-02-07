const express = require("express");
const {
  createNewOrder,
  fetchAllOrders,
  fetchCustomerOrders,
  changeOrderStatusController,
} = require("../controllers/orderController");

const {
  createNewProduct,
  fetchAllProducts,
  fetchAvailableProducts,
  changeProductAvailability,
  deleteProduct,
  uploadProductImage,
} = require("../controllers/productController");

const upload = require("../config/s3upload");
const router = express.Router();

// Orders Routes
router.post("/orders", createNewOrder);
router.get("/get-all-orders", fetchAllOrders);
router.get("/get-customer-orders", fetchCustomerOrders);
router.put("/change-order-status", changeOrderStatusController);

// Products Routes
router.post("/create-product", createNewProduct);
router.get("/get-all-products", fetchAllProducts);
router.get("/get-available-products", fetchAvailableProducts);
router.put("/change-product-availability", changeProductAvailability);
router.delete("/delete-product", deleteProduct);

// Image Upload Route
router.post("/upload-image", upload.single("file"), uploadProductImage);

module.exports = router;
