import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../utils/firebaseConfiguration.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ExcelJS from "exceljs";

dotenv.config();


// export const requestAJobPosting = async (req, res) => {
//   try {
//     const {
//       email,
//       jobTitle,
//       description,
//       vacancy,
//       location,
//       qualification,
//       experience,
//       category
//     } = req.body;

//     // 1. Fetch recruiter document
//     const recruiterRef = collection(db, "recruiters");
//     const q = query(recruiterRef, where("email", "==", email));
//     const querySnapshot = await getDocs(q);

//     if (querySnapshot.empty) {
//       return res.status(403).json({ message: "No User Found, please relogin" });
//     }

//     const recruiterDoc = querySnapshot.docs[0];
//     const recruiterData = recruiterDoc.data();
//     const requestId = uuidv4();

//     // 2. Build job request object
//     const newJobRequest = {
//       requestId,
//       status: "pending",
//       jobTitle,
//       description,
//       vacancy,
//       location,
//       category,
//       qualification,
//       experience,
//       requestedAt: new Date(),
//       recruiter: {
//         contactPersonName: recruiterData.contactPersonName || "N/A",
//         email: recruiterData.email,
//         companyName: recruiterData.companyName || company,
//         number: recruiterData.number || "N/A",
//       },
//     };

//     // 3. Save in "jobsRequested" collection
//     await setDoc(doc(db, "jobsRequested", requestId), newJobRequest);

//     // 4. (Optional) Also update the recruiter's own doc with history
//     const recruiterDocRef = doc(db, "recruiters", recruiterDoc.id);
//     const updatedJobs = Array.isArray(recruiterData.jobsRequested)
//       ? [...recruiterData.jobsRequested, { requestId, jobTitle, status: "pending" }]
//       : [{ requestId, jobTitle, status: "pending" }];

//     await updateDoc(recruiterDocRef, {
//       jobsRequested: updatedJobs,
//     });

//     // 5. Send email notification to admin
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.ADMIN_EMAIL,
//         pass: process.env.ADMIN_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.ADMIN_EMAIL,
//       to: process.env.ADMIN_EMAIL,
//       subject: `🆕 New Job Request: ${jobTitle}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <h2>📢 New Job Posting Request</h2>
//           <p><strong>Recruiter:</strong></p>
//           <ul>
//             <li><strong>Name:</strong> ${recruiterData.contactPersonName}</li>
//             <li><strong>Email:</strong> ${recruiterData.email}</li>
//             <li><strong>Company:</strong> ${recruiterData.companyName}</li>
//             <li><strong>Number:</strong> ${recruiterData.number}</li>
//           </ul>

//           <h3>💼 Job Details</h3>
//           <ul>
//             <li><strong>Title:</strong> ${jobTitle}</li>
//             <li><strong>Description:</strong> ${description}</li>
//             <li><strong>Location:</strong> ${location}</li>
//             <li><strong>Qualification:</strong> ${qualification}</li>
//             <li><strong>Experience:</strong> ${experience}</li>
//             <li><strong>Vacancy:</strong> ${vacancy}</li>
//             <li><strong>Status:</strong> Pending Approval</li>
//           </ul>

//           <p style="margin-top: 20px;">📌 Please review and approve this request in the admin dashboard.</p>
//           <p>Regards,<br><strong>Career Portal</strong></p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     return res.status(200).json({
//       message: "Job request submitted and stored successfully.",
//     });

//   } catch (error) {
//     console.error("Error requesting job posting:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };
export const requestAJobPosting = async (req, res) => {
  try {
    const {
      jobTitle,
      category,
      jobType,
      experience,
      qualification,
      location,
      salary,
      vacancy,
      description,
      recruiter,
      requestedAt,
    } = req.body;

    if (!recruiter || !recruiter.email) {
      return res.status(400).json({ message: "Recruiter details missing." });
    }

    const requestId = uuidv4();

    // Build the job request object
    const newJobRequest = {
      requestId,
      status: "pending",
      jobTitle,
      category,
      jobType,
      experience,
      qualification,
      location,
      salary,
      vacancy,
      description,
      recruiter,
      requestedAt: requestedAt ? new Date(requestedAt) : new Date(),
    };

    // Store in Firestore
    await setDoc(doc(db, "jobsRequested", requestId), newJobRequest);

    // Send admin notification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `🆕 New Job Request: ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>📢 New Job Posting Request</h2>
          <p><strong>Recruiter:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${recruiter.contactPersonName}</li>
            <li><strong>Email:</strong> ${recruiter.email}</li>
            <li><strong>Company:</strong> ${recruiter.companyName}</li>
            <li><strong>Number:</strong> ${recruiter.number}</li>
          </ul>

          <h3>💼 Job Details</h3>
          <ul>
            <li><strong>Title:</strong> ${jobTitle}</li>
            <li><strong>Description:</strong> ${description}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Qualification:</strong> ${qualification}</li>
            <li><strong>Experience:</strong> ${experience}</li>
            <li><strong>Vacancy:</strong> ${vacancy}</li>
            <li><strong>Job Type:</strong> ${jobType}</li>
            <li><strong>Salary:</strong> ${salary}</li>
            <li><strong>Status:</strong> Pending Approval</li>
          </ul>

          <p style="margin-top: 20px;">📌 Please review and approve this request in the admin dashboard.</p>
          <p>Regards,<br><strong>Career Portal</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Job request submitted successfully.",
    });

  } catch (error) {
    console.error("Error requesting job posting:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



export const getRecruiterJobs = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Fetching jobs for recruiter:", email);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Step 1: Query the jobsRequested collection for jobs where recruiter.email == provided email
    const jobsRef = collection(db, "jobsRequested");
    const q = query(jobsRef, where("recruiter.email", "==", email));
    const querySnapshot = await getDocs(q);

    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    console.log("Jobs found:", jobs.length);
    return res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error fetching recruiter jobs from jobsRequested:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRequestedJob = async (req, res) => {
  try {
    const { requestId, email } = req.body;

    const recruiterRef = collection(db, "recruiters");
    const q = query(recruiterRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const recruiterDoc = querySnapshot.docs[0];
    const recruiterDocRef = recruiterDoc.ref;
    const recruiterData = recruiterDoc.data();

    const jobPosted = recruiterData.jobsRequested || [];

    // Filter out the job with the matching requestId
    const updatedJobs = jobPosted.filter((job) => job.requestId !== requestId);

    // Update the Firestore document with the filtered array
    await updateDoc(recruiterDocRef, {
      jobsRequested: updatedJobs,
    });

    return res
      .status(200)
      .json({ message: "Job request deleted successfully" });
  } catch (error) {
    console.error("Error deleting requested job:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRequestedJob = async (req, res) => {
  try {
    const { jobId, email, updatedData } = req.body;

    console.log("➡️ Incoming update request:", { jobId, email, updatedData });

    // Step 1: Find recruiter by email
    const recruiterRef = collection(db, "recruiters");
    const q = query(recruiterRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    const recruiterDoc = querySnapshot.docs[0];
    const recruiterDocRef = recruiterDoc.ref;
    const recruiterData = recruiterDoc.data();

    let jobsRequested = recruiterData.jobsRequested || [];

    // Step 2: Find the job by jobId
    const jobIndex = jobsRequested.findIndex((job) => job.requestId === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Step 3: Update the specific job (log old and new for debug)
    const oldJob = jobsRequested[jobIndex];
    const updatedJob = {
      ...oldJob,
      ...updatedData, // ✅ Overwrite fields like `title`, `description`, etc.
    };

    console.log("🔁 Old Job:", oldJob);
    console.log("✅ New Job:", updatedJob);

    jobsRequested[jobIndex] = updatedJob;

    // Step 4: Write back updated array to Firestore
    await updateDoc(recruiterDocRef, {
      jobsRequested: jobsRequested,
    });

    // Step 5: Confirm write
    console.log("✅ Job updated successfully.");
    return res.status(200).json({ message: "Job updated successfully" });

  } catch (error) {
    console.error("❌ Error updating requested job:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPartner = async(req,res)=>{
  try {
    const partnersRef = collection(db, "recruiters");
    const querySnapshot = await getDocs(partnersRef);

    const partners = [];
    querySnapshot.forEach((doc) => {
      partners.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ recruiters: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const getPartnersInCSV = async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "recruiters"));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Partners");

    worksheet.columns = [
      { header: "Company Name", key: "companyName", width: 30 },
      { header: "Contact Person", key: "contactPersonName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone Number", key: "phone", width: 20 }
    ];

    snapshot.forEach((doc) => {
      const data = doc.data();
      worksheet.addRow({
        companyName: data.companyName || '',
        contactPersonName: data.contactPersonName || '',
        email: data.email || '',
        phone: data.jobsRequested?.number || ''
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=partners.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating partners CSV:", error);
    res.status(500).json({ message: error.message });
  }
};
