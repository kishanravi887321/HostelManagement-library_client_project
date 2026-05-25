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

const startServer = (protocolLabel) => {
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the existing process or change PORT in .env.`);
      console.error(`Windows quick fix: netstat -ano | findstr :${PORT} and taskkill /PID <PID> /F`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => {
    console.log(`${protocolLabel} server running on port ${PORT}`);
  });
};

if (sslKeyPath && sslCertPath) {
  const httpsOptions = {
    key: fs.readFileSync(toAbsolutePath(sslKeyPath)),
    cert: fs.readFileSync(toAbsolutePath(sslCertPath)),
  };

  if (sslCaPath) {
    httpsOptions.ca = fs.readFileSync(toAbsolutePath(sslCaPath));
  }

  server = https.createServer(httpsOptions, app);
  startServer("HTTPS");
} else {
  server = http.createServer(app);
  startServer("HTTP");
}