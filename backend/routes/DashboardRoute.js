import express from "express";
import { getDashboardSummary } from "../controllers/Dashboard.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

router.get("/dashboard/summary", verifyToken, getDashboardSummary);

export default router;