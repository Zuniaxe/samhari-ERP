import express from "express";
import { Login, Me } from "../controllers/Auth.js";
import { getItems, createItem, deleteItem } from "../controllers/Inventory.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { getDashboardStats } from "../controllers/Dashboard.js";

const router = express.Router();

// Public Route
router.post('/login', Login);

// Protected Routes (Harus Login)
router.get('/me', verifyToken, Me);
router.get('/inventory', verifyToken, getItems);
router.post('/inventory', verifyToken, createItem);
router.delete('/inventory/:id', verifyToken, deleteItem);
router.get('/dashboard-stats', verifyToken, getDashboardStats); // Tambahkan ini

export default router;