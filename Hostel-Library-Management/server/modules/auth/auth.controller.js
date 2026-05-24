const ADMIN_EMAIL = "admin@management.com";
const ADMIN_PASSWORD = "admin123";

const login = (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({
      message: "Login successful",
      token: "secure_hostel_library_management_token_2026"
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
};

export { login };
