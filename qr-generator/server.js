import express from "express";
import qrcode from "qrcode";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "..", "backend", ".env") });

const app = express();
const PORT = 5001;

const mongoURI = process.env.MONGO_URI; 
mongoose.connect(mongoURI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

const sessionSchema = new mongoose.Schema({
  passkey: { type: String, required: true },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  subject: { type: String, required: true },
  section: { type: String, required: true },
  expiresAt: { type: Data, required: true }
});

sessionSchema.index({expiresAt: 1}, { expireAfterSeconds: 0 });

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

app.get("/qr", async (req, res) => {
  try {
    const { teacherId, section, subject } = req.query;

    if (!teacherId || !section || !subject) {
      return res.status(400).send("Missing teacherId, section, or subject");
    }

    const passkey = crypto.randomBytes(16).toString("hex");

    await Session.create({
      passkey,
      teacherId,
      subject,
      section,
      expiresAt: new Date(Date.now() + 60 * 1000)
    });

    res.setHeader("Content-Type", "image/png");
    await qrcode.toFileStream(res, passkey);
    
    console.log(`Successfully generated QR for: ${teacherId} - ${subject}`);
  } catch (err) {
    console.error("Internal Server Error Detail:", err);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, process.env.URL, () => {
  console.log(`🚀 QR Generator running on http://${process.env.URL}:${PORT}`);
});
