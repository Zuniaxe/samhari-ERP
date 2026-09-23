import express from "express";
import { getInboundReceipts, createInbound } from "../controllers/Inbound.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

router.get('/inbound', verifyToken, getInboundReceipts);
router.post('/inbound', verifyToken, createInbound);

export default router;