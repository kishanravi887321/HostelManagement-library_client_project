import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import libraryRoutes from "./routes/libraryRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploads so the frontend can access stored files
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

app.use("/api/library", libraryRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("Hostel Library API Running");
});

export default app;
