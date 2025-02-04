const express = require("express");
const {
  createNewOrder,
  fetchAllOrders,
  fetchCustomerOrders,
  changeOrderStatusController
} = require("../controllers/orderController");
const { createNewProduct, fetchAllProducts, fetchAvailableProducts, changeProductAvailability, deleteProduct } = require("../controllers/productController");

const router = express.Router();

router.post("/orders", createNewOrder);
router.get("/get-all-orders", fetchAllOrders);
router.get("/get-customer-orders", fetchCustomerOrders);
router.post("/create-product", createNewProduct);
router.get("/get-all-products", fetchAllProducts);
router.get("/get-available-products", fetchAvailableProducts);
router.put("/change-product-availability", changeProductAvailability);
router.delete("/delete-product", deleteProduct);
router.put("/change-order-status", changeOrderStatusController);

module.exports = router;
