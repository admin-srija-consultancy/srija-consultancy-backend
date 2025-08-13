import { db } from "../utils/firebaseConfiguration.js";
import {
  addDoc,
  collection,
  query,
  updateDoc,
  increment,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  getCountFromServer,
  setDoc
} from "firebase/firestore";
import { jobs } from "googleapis/build/src/apis/jobs/index.js";
import { v4 as uuidv4 } from "uuid";

// import { doc, , collection } from "firebase/firestore";
// import { v4 as uuidv4 } from "uuid";

export const addJobPosting = async (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "Missing requestId" });
  }

  try {
    // 1. Fetch the job request from 'jobsRequested'
    const requestRef = doc(db, "jobsRequested", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return res.status(404).json({ message: "Requested job not found" });
    }

    const jobData = requestSnap.data();

    const {
      category,
      jobTitle,
      description,
      vacancy,
      location,
      qualification,
      experience,
      recruiter,
      salary,
      jobType,
    } = jobData;

    const uniqueJobId = uuidv4();
    const safeCategory = category.replace(/\//g, "-or-");

    // 2. Prepare job data to insert
    const jobPosting = {
      uniqueJobId,
      category,
      company: recruiter.companyName,
      title: jobTitle,
      salary: salary || "Not Mentioned",
      jobType: jobType || "Not Mentioned",
      location,
      experience,
      vacancy,
      description,
      qualification,
    };

    // 3. Update or create category doc
    const categoryDocRef = doc(db, "jobs", safeCategory);
    const categorySnap = await getDoc(categoryDocRef);

    if (!categorySnap.exists()) {
      await setDoc(categoryDocRef, {
        name: category,
        noOfJobs: 1,
      });
    } else {
      await updateDoc(categoryDocRef, {
        noOfJobs: increment(1),
      });
    }

    // 4. Add job to subcollection
    const listRef = collection(db, "jobs", safeCategory, "list");
    await setDoc(doc(listRef, uniqueJobId), jobPosting);

    // 5. Mark request as approved
    await updateDoc(requestRef, {
      status: "approved",
    });

    return res.status(200).json({ message: "Job approved and added successfully" });

  } catch (error) {
    console.error("Error approving job:", error.message);
    return res.status(500).json({ message: error.message });
  }
};
export const postJob = async (req, res) => {
  try {
    const {
      jobTitle,
      category,
      description,
      experience,
      jobType,
      location,
      qualification,
      salary,
      vacancy,
      companyName,
      contactPersonName,
      email,
      number,
      status,
      requestedAt,
    } = req.body;

    // Basic validation
    if (
      !jobTitle ||
      !category ||
      !description ||
      !experience ||
      !jobType ||
      !location ||
      !qualification ||
      !salary ||
      vacancy == null ||
      !companyName ||
      !contactPersonName ||
      !email ||
      !number ||
      !status
    ) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Generate unique IDs
    const uniqueJobId = uuidv4();
    const requestId = uuidv4(); // dynamically generate requestId
    const safeCategory = category.replace(/\//g, "-or-");

    // Job data
    const jobData = {
  uniqueId: uniqueJobId,           // was uniqueJobId
  title: jobTitle,                  // unchanged
  jobCategory: category,            // renamed to match your example
  description,                      // unchanged
  experience,                       // unchanged
  jobType,                          // unchanged
  location,                          // unchanged
  qualification,                     // unchanged
  salary,                             // unchanged
  vacancy,                            // unchanged
  company: companyName,              // renamed to 'company'
  contactPersonName,                 // unchanged
  email,                              // unchanged
  number,                             // unchanged
  status,                             // unchanged
  responsibility,                    // added based on your example
  requestedAt: requestedAt || new Date().toISOString()
};


    // 1. Add to category collection
    const categoryDocRef = doc(db, "jobs", safeCategory);
    const categorySnap = await getDoc(categoryDocRef);

    if (!categorySnap.exists()) {
      await setDoc(categoryDocRef, {
        name: category,
        noOfJobs: 1
      });
    } else {
      await updateDoc(categoryDocRef, {
        noOfJobs: increment(1)
      });
    }

    // 2. Add job to subcollection inside category
    const listRef = collection(db, "jobs", safeCategory, "list");
    await setDoc(doc(listRef, uniqueJobId), jobData);

    // 3. Add/update jobsRequested collection
    const requestDocRef = doc(db, "jobsRequested", requestId);
    await setDoc(requestDocRef, {
      category,
      description,
      experience,
      jobTitle,
      jobType,
      location,
      qualification,
      recruiter: { companyName, contactPersonName, email, number },
      companyName,
      contactPersonName,
      email,
      number,
      requestId,
      requestedAt: requestedAt || new Date().toISOString(),
      salary,
      status: "approved",
      vacancy
    });

    return res.status(200).json({
      message: "Job posted successfully",
      jobId: uniqueJobId,
      requestId
    });
  } catch (error) {
    console.error("Error posting job:", error);
    return res.status(500).json({ message: error.message });
  }
};
export const addNewJobPosting = async (req, res) => {
  const {
    role,
    companyName,
    salary,
    jobType,
    location,
    experience,
    vacancy,
    description,
    qualification,
    responsibilities,
  } = req.body;

  const uniqueJobId = uuidv4();

  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      uniqueJobId,
      companyName,
      role,
      salary,
      jobType,
      location,
      experience,
      vacancy,
      description,
      qualification,
      responsibility: responsibilities,
    });
    console.log("job added");
    return res.status(200).json({ message: "Job added successfully" });
  } catch (error) {
    console.log("failed");
    return res.status(500).json({ message: error.message });
  }
};

export const fetchAllJobs = async (req, res) => {
  try {
    const jobsByCategory = {};

    // 1. Get all category documents inside "jobs"
    const categoryDocs = await getDocs(collection(db, "jobs"));
    // console.log(categoryDocs.docs)
    for (const docSnap of categoryDocs.docs) {
      // console.log(docSnap.data)
      const category = docSnap.id; // e.g., "Admin Jobs" (or "Admin Jobs-or-Robotics")
      const safeCategory = category; // Use as-is, unless you're decoding a transformation

      // 2. Access the subcollection "list" under each category
      const listRef = collection(db, "jobs", safeCategory, "list");
      const listSnapshot = await getDocs(listRef);

      const jobs = listSnapshot.docs.map((jobDoc) => ({
        id: jobDoc.id,
        ...jobDoc.data()
      }));

      jobsByCategory[category] = jobs;
    }

    return res.status(200).json(jobsByCategory);
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getJobByCategory = async (req, res) => {
  try {
    const { category, candidateId } = req.body;
    if(candidateId === '' || candidateId === undefined || candidateId === null) {
      console.log("candidateId is empty or undefined");
    }
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const safeCategory = category.replace(/\//g, "-or-");
    const listRef = collection(db, "jobs", safeCategory, "list");

    const jobsSnapshot = await getDocs(listRef);

    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If candidateId is provided, return only jobs where they have NOT applied
    const filteredJobs = candidateId
      ? jobs.filter(job =>
          !Array.isArray(job.interestedCandidates) ||
          !job.interestedCandidates.includes(candidateId)
        )
      : jobs;

    return res.status(200).json(filteredJobs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getJobCategory = async (req, res) => {
  try {
    const categoryDocs = await getDocs(collection(db, "jobs"));
    const jobCategory = [];

    for (const category of categoryDocs.docs) {
      const data = category.data();

      jobCategory.push({
        name: data.name || category.id.replace(/-or-/g, "/"),
        count: data.noOfJobs || 0, // default to 0 if not present
      });
    }

    return res.status(200).json({ categories: jobCategory });
  } catch (error) {
    console.error("Error fetching job categories:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getJob = async (req, res) => {
  try {
    const {companyName} = req.body;
    const jobsRef = collection(db, "jobs");
    const q = query(jobsRef, where("companyName", "==", companyName));
    const querySnapshot = await getDocs(q);
    // const querySnapshot = await getDocs(collection(db, "jobs"));
    console.log(companyName)
    const jobs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ jobs: jobs });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

export const deleteJobs = async (req, res) => {
  const { uniqueId, category } = req.body;

  if (!uniqueId || !category) {
    return res.status(400).json({ message: "Missing uniqueId or category." });
  }

  try {
    // 1. Reference to the job document inside the subcollection
    const safeCategory = category.replace(/\//g, "-or-");

    const jobDocRef = doc(db, "jobs", safeCategory, "list", uniqueId);
    const jobDocSnap = await getDoc(jobDocRef);

    if (!jobDocSnap.exists()) {
      return res.status(404).json({ message: "Job not found in this category." });
    }

    // 2. Delete the job document
    await deleteDoc(jobDocRef);

    // 3. Decrement the job count in the category document
    const categoryDocRef = doc(db, "jobs", safeCategory);
    const categorySnap = await getDoc(categoryDocRef);

    if (categorySnap.exists()) {
      await updateDoc(categoryDocRef, {
        noOfJobs: increment(-1),
      });
    }

    return res.status(200).json({ message: "Job deleted successfully." });
  } catch (error) {
    console.error("Error deleting job:", error.message);
    return res.status(500).json({ message: "Failed to delete job." });
  }
};
