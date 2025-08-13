import express from "express";
import nodemailer from "nodemailer";
import { db } from "../utils/firebaseConfiguration.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import dotenv from "dotenv";
import {
  addCategory,
  addTestimonial,
  createBlog,
  deleteBlog,
  deleteTestimonial,
  fetchBlogs,
  fetchTestimonials,
  getAllPartners,
  getCandidatesForJobInExcel,
  getJobsRequested,
  getPartnerById,
} from "../controller/adminController.js";
import upload from "../middleware/upload.js";
import { arrayUnion } from "firebase/firestore";

dotenv.config();

const router = express.Router();

router.use("/add-blogs", upload.single("file"), createBlog);
router.use("/fetch-blogs", fetchBlogs);
router.use("/getJobsRequested", getJobsRequested);
router.use("/delete-blog", deleteBlog);
router.use("/getCandidatesForJobInExcel",getCandidatesForJobInExcel)
router.use("/getPartners",getAllPartners)
router.use("/getCompanyById",getPartnerById)
router.use("/add-category",addCategory)
router.use("/add-testimonials",upload.single("file"),addTestimonial)
router.use("/fetch-testimonials",fetchTestimonials)
router.delete("/delete-testimonial/:id", deleteTestimonial);
router.post("/notify-interest", async (req, res) => {
  try {
    const { jobId, jobCategory, email } = req.body;

    const safeCategory = jobCategory.replace(/\//g, "-or-");

    // Reference the specific job document directly by ID
    const jobDocRef = doc(db, "jobs", safeCategory, "list", jobId);
    const jobSnap = await getDoc(jobDocRef);

    if (!jobSnap.exists()) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = jobSnap.data();

    // Query candidate by email
    const candidatesRef = collection(db, "candidates");
    const candidateQuery = query(candidatesRef, where("email", "==", email));
    const candidateSnapshot = await getDocs(candidateQuery);

    if (candidateSnapshot.empty) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const candidateDoc = candidateSnapshot.docs[0];
    const candidate = candidateDoc.data();
    const candidateId = candidateDoc.id;

    // Add candidate ID to job's interestedCandidates array
    await updateDoc(jobDocRef, {
      interestedCandidates: arrayUnion(candidateId),
    });

    // Add job ID to candidate's interestedJobs array
    const candidateDocRef = doc(db, "candidates", candidateId);
    await updateDoc(candidateDocRef, {
      interestedJobs: arrayUnion({
        company: job.company,
        title: job.title,
        jobId: jobId,
      }),
    });
// Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  },
});

// 1️⃣ Email to HR
const hrMailOptions = {
  from: process.env.ADMIN_EMAIL,
  to: process.env.HR_EMAIL,
  subject: `Candidate Interested in ${job.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">📩 Candidate Interest Notification</h2>
      <p>A candidate has expressed interest in the following job opportunity. Please find their details below:</p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />

      <h3 style="color: #34495e;">👤 Candidate Details</h3>
      <table cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
        <tr><td><strong>Name:</strong></td><td>${candidate.name}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${candidate.email}</td></tr>
        <tr><td><strong>Resume:</strong></td><td><a href="${candidate.resumeURL}" target="_blank" style="color: #2980b9;">View Resume</a></td></tr>
      </table>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />

      <h3 style="color: #34495e;">💼 Job Description</h3>
      <table cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
        <tr><td><strong>Company:</strong></td><td>${job.company}</td></tr>
        <tr><td><strong>Role:</strong></td><td>${job.title}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${job.location}</td></tr>
        <tr><td><strong>Experience:</strong></td><td>${job.experience}</td></tr>
        <tr><td><strong>Salary:</strong></td><td>${job.salary}</td></tr>
        <tr><td><strong>Job Type:</strong></td><td>${job.jobType}</td></tr>
        <tr><td><strong>Vacancy:</strong></td><td>${job.vacancy}</td></tr>
        <tr><td style="vertical-align: top;"><strong>Description:</strong></td><td>${job.description}</td></tr>
        <tr><td style="vertical-align: top;"><strong>Qualification:</strong></td><td>${job.qualification}</td></tr>
        <tr><td style="vertical-align: top;"><strong>Responsibilities:</strong></td><td>${job.responsibility}</td></tr>
      </table>

      <p style="margin-top: 30px;">Regards,<br><strong>Career Portal</strong></p>
    </div>
  `,
};

await transporter.sendMail(hrMailOptions);
const acktransporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.HR_EMAIL,
    pass: process.env.HR_PASS,
  },
});
// 2️⃣ Acknowledgment Email to Candidate
const candidateAckOptions = {
  from: process.env.HR_EMAIL,
  to: candidate.email,
  subject: `✅ Your application for ${job.title} has been received`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">Hi ${candidate.name},</h2>
      <p>Thank you for showing interest in the <strong>${job.title}</strong> role at <strong>${job.company}</strong>.</p>
      <p>We have received your details and shared them with the HR team.</p>
      <p>They will review your application and get back to you if your profile matches the requirements.</p>
      <p><strong>Summary of your application:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${candidate.name}</li>
        <li><strong>Email:</strong> ${candidate.email}</li>
        <li><a href="${candidate.resumeURL}" target="_blank">View Resume</a></li>
      </ul>
      <p>Best regards,<br><strong>Career Portal Team</strong></p>
    </div>
  `,
};

await acktransporter.sendMail(candidateAckOptions);

res.json({ message: "Email sent to HR and acknowledgment sent to candidate" });

  } catch (err) {
    console.error("Error sending interest email:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
