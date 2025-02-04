const { createOrder, getAllOrders, getCustomerOrders, changeOrderStatusModel } = require("../models/orderModel");
const { getOrCreateCustomer } = require("../models/customerModel");
const { sendPushNotification } = require("../services/notificationService");

const createNewOrder = async (req, res) => {
  try {
    const { cartItems, deliveryDetails, totalPrice, orderDate, orderStatus } = req.body;
    console.log("req.body", req.body);
    const { customerName, mobileNumber, city, deliveryPoint, deliveryDate } =
      deliveryDetails;

    const customerId = await getOrCreateCustomer(customerName, mobileNumber);
    const order = await createOrder(customerId, {
      orderDate,
      deliveryDate,
      city,
      deliveryPoint,
      totalPrice,
      cartItems,
      orderStatus
    });

    // Send Push Notification
    await sendPushNotification(customerName, order);

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ message: "Error saving order." });
  }
};

const fetchAllOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders." });
  }
};

const fetchCustomerOrders = async (req, res) => {
  try {
    const { mobileNumber } = req.query;
    const orders = await getCustomerOrders(mobileNumber);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders." });
  }
};

const changeOrderStatusController = async (req, res) => {
  try {
    const { order_id, order_status } = req.body;
    const orders = await changeOrderStatusModel(order_id, order_status);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders." });
  }
};

module.exports = { createNewOrder, fetchAllOrders, fetchCustomerOrders, changeOrderStatusController };
