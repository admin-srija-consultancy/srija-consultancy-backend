// import express from "express";
// import { oauth2Client } from "../utils/googleClient.js";
// import fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();

// const googleAuthRoutes = express.Router();

// // 1️⃣ Step 1: Initiate OAuth2 Consent Flow
// googleAuthRoutes.get("/auth/google", (req, res) => {
//   const url = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     prompt: "consent", // always ask to return refresh_token
//     scope: ["https://www.googleapis.com/auth/drive.file"],
//   });

//   res.redirect(url);
// });

// // 2️⃣ Step 2: Handle OAuth2 callback
// googleAuthRoutes.get("/oauth2callback", async (req, res) => {
//   const code = req.query.code;

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     // Save refresh token
//     if (tokens.refresh_token) {
//       const envPath = ".env";
//       const envVars = fs.readFileSync(envPath, "utf-8").split("\n");
//       const newEnv = envVars
//         .map((line) => {
//           if (line.startsWith("GOOGLE_REFRESH_TOKEN=")) {
//             return `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
//           }
//           return line;
//         })
//         .join("\n");

//       fs.writeFileSync(envPath, newEnv, "utf-8");
//       console.log("✅ Refresh token saved to .env");
//     }

//     res.send("✅ Google Drive authentication successful! You can now upload files.");
//   } catch (error) {
//     console.error("Error exchanging code:", error);
//     res.status(500).send("❌ Error during Google authentication.");
//   }
// });

// export default googleAuthRoutes;
import { google } from "googleapis";
import express from "express";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const googleAuthRoutes = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
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

// Step 2: Handle callback and save tokens
googleAuthRoutes.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync("tokens.json", JSON.stringify(tokens)); // 🔐 store token
    res.send("Authorization successful! You can close this window.");
  } catch (err) {
    console.error("Error exchanging code:", err);
    res.status(500).send("Error during authentication");
  }
});

export default googleAuthRoutes;
