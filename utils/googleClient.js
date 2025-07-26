import { google } from "googleapis";
import { config } from "dotenv";
config()
console.log(process.env.GOOGLE_CLIENT_ID)
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Load refresh token if present
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

export const drive = google.drive({ version: "v3", auth: oauth2Client });
