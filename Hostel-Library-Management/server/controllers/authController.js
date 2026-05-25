import bcrypt from "bcryptjs";
import {
  getAdminCredentials,
  updateAdminCredentials,
} from "../utils/adminCredentialsStore.js";

const ADMIN_TOKEN = "secure_hostel_library_management_token_2026";

const login = (req, res) => {
  const { username, password } = req.body;
  const credentials = getAdminCredentials();

  if (username === credentials.username && bcrypt.compareSync(password, credentials.passwordHash)) {
    return res.json({
      message: "Login successful",
      token: ADMIN_TOKEN
    });
  }

  return res.status(401).json({ message: "Invalid username or password" });
};

const getCredentials = (req, res) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const credentials = getAdminCredentials();

  return res.json({
    username: credentials.username,
  });
};

const updateCredentials = (req, res) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { username, oldPassword, password } = req.body;

  if (!username || !oldPassword || !password) {
    return res.status(400).json({ message: "Username, current password, and new password are required" });
  }

  const credentials = getAdminCredentials();

  if (!bcrypt.compareSync(oldPassword, credentials.passwordHash)) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  updateAdminCredentials(username.trim(), password);

  return res.json({
    message: "Credentials updated successfully",
    username: username.trim(),
  });
};

export {
  getCredentials,
  login,
  updateCredentials,
};
