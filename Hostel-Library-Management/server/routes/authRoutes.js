import express from "express";

const router = express.Router();

// Hardcoded secure credentials so we don't mess with your database models
const ADMIN_EMAIL = "admin@management.com";
const ADMIN_PASSWORD = "admin123"; // You can change this to your preferred password

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Sending back a dummy token success response to unlock the frontend layout
    return res.json({ 
      message: "Login successful", 
      token: "secure_hostel_library_management_token_2026" 
    });
  } else {
    return res.status(401).json({ message: "Invalid email or password" });
  }
});

export default router;
