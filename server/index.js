
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const listingsRouter = require("./routes/listings");
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/listings", listingsRouter);
// Basic test route
app.get("/", (req, res) => {
  res.json({
    message: "TraceCrop backend is running!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TraceCrop API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TraceCrop backend running at http://localhost:${PORT}`);
});
