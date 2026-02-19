import express from "express";
import qrcode from "qrcode";
import crypto from "crypto";
import { Session } from "../models/Session.js";

const router = express.Router();

router.get("/qr", async (req, res) => {
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
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    res.setHeader("Content-Type", "image/png");
    await qrcode.toFileStream(res, passkey);

    console.log(`Successfully generated QR for: ${teacherId} - ${subject}`);
  } catch (err) {
    console.error("Internal Server Error Detail:", err);
    res.status(500).send(err.message);
  }
});

export default router;
