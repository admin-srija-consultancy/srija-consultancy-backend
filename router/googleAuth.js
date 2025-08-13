import { google } from "googleapis";
import express from "express";
import dotenv from "dotenv";
import { db } from "../utils/firebaseConfiguration.js";
import { doc, setDoc } from "firebase/firestore";

dotenv.config();

const googleAuthRoutes = express.Router();

const TOKEN_DOC = doc(db, "system", "googleDriveToken");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://srija-consultancy-backend-llao.onrender.com/oauth2callback'
);

// Step 1: Start login
googleAuthRoutes.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
  });
  res.redirect(url);
});

// Step 2: Handle callback and save tokens to Firestore
googleAuthRoutes.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  console.log(`Code: ${code}`);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to Firestore
    await setDoc(TOKEN_DOC, tokens);

    res.send("✅ Authorization successful! Tokens saved to Firestore.");
  } catch (err) {
    console.error("Error exchanging code:", err);
    res.status(500).send("❌ Error during authentication");
  }
});

export default googleAuthRoutes;
