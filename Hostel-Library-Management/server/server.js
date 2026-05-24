const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // 🆕 Imported path module for managing file paths
const libraryRoutes = require("./routes/libraryRoutes");
const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
const hostelRoutes = require("./routes/hostelRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

// DB connection (ONLY ONCE)
connectDB();

require("./utils/monthlyReset");

const app = express();

app.use(cors());
app.use(express.json());

// 🆕 Step 2: Serve the uploads folder statically so browsers can view files inside it
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Routes
app.use("/api/library", libraryRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hostel Library API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});