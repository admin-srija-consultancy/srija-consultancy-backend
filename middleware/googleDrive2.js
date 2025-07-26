import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 🔁 Load saved tokens from file (or DB in production)
oauth2Client.setCredentials({
  access_token: process.env.ACCESS_TOKEN,
  refresh_token: process.env.REFRESH_TOKEN,
  expiry_date: Number(process.env.EXPIRY_DATE),
});


export const uploadToDrive = async (buffer, filename, mimetype, folderId) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = {
    name: filename,
    parents: [folderId], // Your Drive folder ID
  };

  const media = {
    mimeType: mimetype,
    body: Buffer.from(buffer),
  };

  const { data } = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: mimetype,
      body: bufferToStream(buffer),
    },
    fields: "id",
  });

  // Make file public
  await drive.permissions.create({
    fileId: data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  const fileUrl = `https://drive.google.com/uc?id=${data.id}`;
  return fileUrl;
};

import { Readable } from "stream";
// Helper to convert buffer to stream
function bufferToStream(buffer) {
//   const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
