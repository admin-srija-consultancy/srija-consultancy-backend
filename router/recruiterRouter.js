import { Router } from "express";
import { deleteRequestedJob, getRecruiterJobs,getAllPartner,getPartnersInCSV, requestAJobPosting,updateRequestedJob } from "../controller/recruiterController.js";

const recruiterRouter = Router();

recruiterRouter.use("/requestJobPosting",requestAJobPosting)
recruiterRouter.use("/getJobsPosted",getRecruiterJobs);
recruiterRouter.use("/deleteJob",deleteRequestedJob)
recruiterRouter.use("/updateJob",updateRequestedJob)
recruiterRouter.use("/fetchAllRecruiters",getAllPartner)
recruiterRouter.use("/getPartnerInCSV",getPartnersInCSV)

export default recruiterRouter;