import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../utils/firebaseConfiguration.js";
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