import express from "express";
import qrcode from "qrcode";
import crypto from "crypto";
import { Session } from "../models/Session.js";

const router = express.Router();

router.get("/qr", async (req, res) => {
  try {
    const { teacherId, branch, section, subject } = req.query;

    if (!teacherId || !section || !subject || !branch) {
      return res
        .status(400)
        .send("Missing teacherId, branch, section or subject");
    }

    const passkey = crypto.randomBytes(16).toString("hex");

    const complexPayload = `${branch}|${subject}|${section}|${passkey}|${Date.now()}`;

    await Session.create({
      passkey,
      teacherId,
      subject,
      section,
      branch,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    res.setHeader("Content-Type", "image/png");
    await qrcode.toFileStream(res, complexPayload, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    console.log(`Successfully generated QR for: ${teacherId} - ${subject}`);
  } catch (err) {
    console.error("Internal Server Error Detail:", err);
    res.status(500).send(err.message);
  }
});

export default router;
