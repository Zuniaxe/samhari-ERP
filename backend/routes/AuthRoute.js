import express from "express";
import { Login, Me } from "../controllers/Auth.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

router.post('/login', Login);
router.get('/me', verifyToken, Me);

export default router;