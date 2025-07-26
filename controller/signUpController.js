import { collection, addDoc } from "firebase/firestore";
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
const folderId = '1mycRo1Vk09V1MSqGybmpjtk8vX1lj-ew'
// export const candidateSignUp = async (req, res) => {
//   try {
//     const { name, email, number, education } = req.body;
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ error: "Resume file is missing" });
//     }

//     // const result = await uploadToCloudinary();
//      const driveLink = await uploadToDrive(file.buffer, `${Date.now()}_${file.originalname}`, file.mimetype, folderId);
//     const appliedJobs=[]
//     // Step 2: Save candidate data to Firestore
//     const docRef = await addDoc(collection(db, "candidates"), {
//       name,
//       email,
//       number,
//       education,
//       // resumeURL: result.secure_url,
//       resumeURL:driveLink,
//       appliedJobs,
//       timestamp: new Date(),
//     });

//     res.status(200).json({ message: "Candidate data uploaded", id: docRef.id });
//   } catch (error) {
//     console.error("Error uploading candidate data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// // };
// import { uploadToDrive } from "../utils/googleDrive.js";
// import { db } from "../utils/firebaseConfiguration.js";
// import { addDoc, collection } from "firebase/firestore";

// const folderId = "YOUR_FOLDER_ID_HERE"; // Replace with actual Google Drive folder ID

export const candidateSignUp = async (req, res) => {
  try {
    const { name, email, number, education } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Resume file is missing" });

    const driveLink = await uploadToDrive(file.buffer, `${Date.now()}_${file.originalname}`, file.mimetype, folderId);

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


export const recruiterSignUp = async(req,res)=>{
    console.log(req.body)
    const {companyName, contactPersonName, email, number} = req.body;

    try {
        const docRef = await addDoc(collection(db,"recruiters"),{
            companyName,
            contactPersonName,
            email,
            number
        });
        console.log("registered")
        res.status(200).json({message:"Registeration Successful"});
    } catch (error) {
        res.status(500).json({message:"Something went wrong"});
    }
}