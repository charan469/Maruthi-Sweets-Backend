require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const orderRoutes = require("./src/routes/orderRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", orderRoutes);

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
