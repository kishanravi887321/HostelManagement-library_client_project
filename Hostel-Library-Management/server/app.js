import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import utilsRoutes from "./routes/utilsRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Serve uploads so the frontend can access stored files
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

app.use("/api/library", libraryRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/utils", utilsRoutes);

app.get("/", (req, res) => {
  res.send("Hostel Library API Running");
});

export default app;
