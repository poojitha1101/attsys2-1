import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js";
import qrRouter from "./routes/qr.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ Connection error:", err));

app.use("/", qrRouter);
app.use("/api", authRoutes);
app.use("/api/attendance", attendanceRoutes);

app.listen(process.env.PORT, process.env.URL, () =>
  console.log("🚀 Server running on port 5000"),
);
