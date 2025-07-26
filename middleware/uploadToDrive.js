import { drive, oauth2Client } from "../utils/googleClient.js";

export const uploadToDrive = async (buffer, filename, mimetype, folderId) => {
  try {
    const fileMetadata = {
      name: filename,
      parents: [folderId],
    };

    const media = {
      mimeType: mimetype,
      body: Buffer.from(buffer),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimetype,
        body: media.body,
      },
      fields: "id",
    });

    const fileId = res.data.id;

    // Make the file public
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const fileUrl = `https://drive.google.com/uc?id=${fileId}`;
    return fileUrl;
  } catch (err) {
    console.error("Error uploading to Drive:", err);
    throw err;
  }
};
