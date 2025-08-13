import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebaseConfiguration.js";
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import { uploadToDrive } from "../middleware/googleDrive2.js";
config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const folderId = process.env.FOLDER_ID


export const candidateSignUp = async (req, res) => {
  try {
    const { name, email, number, education } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Resume file is missing" });

    // 1️⃣ Check if candidate with same email exists
    const q = query(collection(db, "candidates"), where("email", "==", email));
    const existing = await getDocs(q);

    if (!existing.empty) {
      return res.status(400).json({ error: "Candidate with this email already exists" });
    }

    // 2️⃣ Upload file to Google Drive
    const driveLink = await uploadToDrive(
      file.buffer,
      `${Date.now()}_${file.originalname}`,
      file.mimetype,
      folderId
    );

    // 3️⃣ Add new candidate document
    const docRef = await addDoc(collection(db, "candidates"), {
      name,
      email,
      number,
      education,
      resumeURL: driveLink,
      appliedJobs: [],
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Candidate added", id: docRef.id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const recruiterSignUp = async (req, res) => {
  const { companyName, contactPersonName, email, number } = req.body;

  try {
    

    // 2️⃣ Check for duplicate company name
    const companyQuery = query(
      collection(db, "recruiters"),
      where("companyName", "==", companyName)
    );
    const companySnapshot = await getDocs(companyQuery);

    if (!companySnapshot.empty) {
      return res.status(400).json({ message: "This company name already exists" });
    }
    // 1️⃣ Check for duplicate email
    const emailQuery = query(
      collection(db, "recruiters"),
      where("email", "==", email)
    );
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      return res.status(400).json({ message: "Recruiter with this email already exists" });
    }

    // 3️⃣ Add new recruiter
    await addDoc(collection(db, "recruiters"), {
      companyName,
      contactPersonName,
      email,
      number,
    });

    console.log("Recruiter registered");
    res.status(200).json({ message: "Registration Successful" });
  } catch (error) {
    console.error("Error registering recruiter:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};