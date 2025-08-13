import { google } from "googleapis";
import { Readable } from "stream";
import { db } from "../utils/firebaseConfiguration.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Firestore location for the saved token
const TOKEN_DOC = doc(db, "system", "googleDriveToken");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Helper: Convert buffer to readable stream
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Helper: Load credentials from Firestore and set them to oauth2Client
async function setAuthFromFirestore() {
  const tokenSnap = await getDoc(TOKEN_DOC);
  if (!tokenSnap.exists()) {
    throw new Error("❌ Google Drive token not found in Firestore.");
  }

  const tokens = tokenSnap.data();
  oauth2Client.setCredentials(tokens);

  // Listen for token refresh and save the new tokens
  oauth2Client.on("tokens", async (newTokens) => {
    console.log("🔄 Token refreshed:", newTokens);
    const updatedTokens = { ...tokens, ...newTokens };
    await setDoc(TOKEN_DOC, updatedTokens);
  });
}

export const uploadToDrive = async (buffer, filename, mimetype, folderId) => {
  // Load credentials from Firestore
  await setAuthFromFirestore();

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  // Upload file
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

  // Direct image-friendly link
  const fileUrl = `https://lh3.googleusercontent.com/d/${data.id}`;
  return fileUrl;
};
