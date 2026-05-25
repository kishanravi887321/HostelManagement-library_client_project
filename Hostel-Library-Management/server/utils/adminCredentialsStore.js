import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const credentialsFilePath = path.resolve(__dirname, "../data/admin-credentials.json");
const defaultPassword = "Subhash@#26";
const defaultUsername = "Subhash_26";

const ensureCredentialsFile = () => {
  if (fs.existsSync(credentialsFilePath)) {
    return;
  }

  fs.mkdirSync(path.dirname(credentialsFilePath), { recursive: true });
  const initialCredentials = {
    username: defaultUsername,
    passwordHash: bcrypt.hashSync(defaultPassword, 10),
  };

  fs.writeFileSync(credentialsFilePath, JSON.stringify(initialCredentials, null, 2), "utf8");
};

const readCredentialsFile = () => {
  ensureCredentialsFile();
  const rawFile = fs.readFileSync(credentialsFilePath, "utf8");
  return JSON.parse(rawFile);
};

const getAdminCredentials = () => readCredentialsFile();

const updateAdminCredentials = (username, password) => {
  const updatedCredentials = {
    username,
    passwordHash: bcrypt.hashSync(password, 10),
  };

  fs.writeFileSync(credentialsFilePath, JSON.stringify(updatedCredentials, null, 2), "utf8");
  return updatedCredentials;
};

export {
  getAdminCredentials,
  updateAdminCredentials,
};
