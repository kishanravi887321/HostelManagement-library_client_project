import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import connectDB from "./config/db.js";
import "./utils/monthlyReset.js";

dotenv.config();

// DB connection (ONLY ONCE)
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;
const sslCaPath = process.env.SSL_CA_PATH;

const toAbsolutePath = (filePath) => {
  if (!filePath) {
    return filePath;
  }
  return path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath);
};

let server;

if (sslKeyPath && sslCertPath) {
  const httpsOptions = {
    key: fs.readFileSync(toAbsolutePath(sslKeyPath)),
    cert: fs.readFileSync(toAbsolutePath(sslCertPath)),
  };

  if (sslCaPath) {
    httpsOptions.ca = fs.readFileSync(toAbsolutePath(sslCaPath));
  }

  server = https.createServer(httpsOptions, app);
  server.listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
  });
} else {
  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
}