import express from "express";
import { getStockMovements, createManualTransaction } from "../controllers/Operations.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { checkRole } from "../middleware/roleVerify.js";

const router = express.Router();

// GET: Semua role bisa melihat history
router.get("/operations", verifyToken, getStockMovements);

// POST: HANYA ADMIN yang bisa membuat transaksi manual Inbound/Outbound
router.post("/operations", verifyToken, checkRole(['admin']), createManualTransaction);

export default router;