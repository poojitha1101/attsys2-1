import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendance.js";
import qrRouter from "./routes/qr.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "https://attsys2-0.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

const HOST = '0.0.0.0';

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ Connection error:", err));

app.use("/", qrRouter);
app.use("/api", authRoutes);
app.use("/api/attendance", attendanceRoutes);

app.listen(PORT, HOST, () =>
  console.log("🚀 Server running on port 5000"),
);
