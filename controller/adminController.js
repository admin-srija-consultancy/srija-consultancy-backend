import { collection, addDoc, getDocs, query, where, getDoc,doc,deleteDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfiguration.js";
import ExcelJS from "exceljs";
// import { uploadToDrive } from "../middleware/googleDrive2.js";


const folderId = "1RrOSC25gClytkBDptOH3UorxzBxflEHg";
export const createBlog = async (req, res) => {
  try {
    const { title, description,author} = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is missing" });
    }

    if (!folderId) {
      return res.status(400).json({ error: "Google Drive folderId is required" });
    }

    // Upload image to the specified Google Drive folder
    // const imageURL = await uploadToDrive(
    //   file.buffer,
    //   `${Date.now()}_${file.originalname}`,
    //   file.mimetype,
    //   folderId
    // );
    const imageURL = "";

    // Save blog details to Firestore
    const docRef = await addDoc(collection(db, "blogs"), {
      title,
      description,
      imageURL,
      author,
      createdAt: new Date(),
    });

    res.status(200).json({ message: "Blog created successfully", id: docRef.id });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const fetchBlogs = async (req, res) => {
  try {
    const blogsRef = collection(db, "blogs");

    // Fetch blogs ordered by creation date (newest first)
    const q = query(blogsRef);
    const querySnapshot = await getDocs(q);

    const blogs = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || null, // 🔧 safe formatting
      };
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
};

export const deleteBlog = async (req, res) => {
  try{
    const {id} = req.body;
    if (!id) {
      return res.status(400).json({ error: "Blog ID is required" });
    }

    // Delete the blog from Firestore
    const blogRef = doc(db, "blogs", id);
    await deleteDoc(blogRef);

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
};



export const getJobsRequested = async (req, res) => {
  try {
    // Filter: only fetch jobs where status == "pending"
    const jobsRef = collection(db, "jobsRequested");
    const q = query(jobsRef, where("status", "==", "pending"));
    const snapshot = await getDocs(q);

    const jobs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        category: data.category || "",
        description: data.description || "",
        experience: data.experience || "",
        jobTitle: data.jobTitle || "",
        location: data.location || "",
        qualification: data.qualification || "",
        vacancy: data.vacancy || "",
        salary: data.salary || "",
        jobType: data.jobType || "",
        status: data.status || "pending",
        requestedAt: data.requestedAt || "",
        recruiter: {
          companyName: data.recruiter?.companyName || "",
          contactPersonName: data.recruiter?.contactPersonName || "",
          email: data.recruiter?.email || "",
          number: data.recruiter?.number || ""
        },
        requestId: doc.id
      };
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching job requests:", error);
    res.status(500).json({ error: "Failed to fetch job requests" });
  }
};





export const getCandidatesForJobInExcel = async (req, res) => {
  try {
    const { jobId, category } = req.body; // or use req.body depending on method
    if (!jobId || !category) {
      return res.status(400).json({ message: "jobId and category are required" });
    }

    const safeCategory = category.replace(/\//g, "-or-");
    const jobDocRef = doc(db, "jobs", safeCategory, "list", jobId);
    const jobSnap = await getDoc(jobDocRef);

    if (!jobSnap.exists()) {
      return res.status(404).json({ message: "Job not found" });
    }

    const jobData = jobSnap.data();
    const candidateIds = jobData.interestedCandidates || [];

    if (!candidateIds.length) {
      return res.status(404).json({ message: "No candidates applied for this job" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Candidates");

    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Education", key: "education", width: 30 },
      { header: "Resume URL", key: "resume", width: 50 },
      
    ];

    for (const c of candidateIds) {
      const candidateId = typeof c === "string" ? c : c.candidateId;
      const candidateDoc = await getDoc(doc(db, "candidates", candidateId));
      if (candidateDoc.exists()) {
        const data = candidateDoc.data();
        worksheet.addRow({
          name: data.name || '',
          email: data.email || '',
          phone: data.number || '',
          resume: data.resumeURL || '',
          education: data.education || ''
        });
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=candidates_${jobId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
