import express from "express";
// PERBAIKAN: Pastikan namanya getValuationReport
import { getValuationReport } from "../controllers/Reports.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

// Endpoint untuk mengambil laporan valuasi
router.get("/reports/valuation", verifyToken, getValuationReport);

export default router;