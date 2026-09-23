import express from "express";
import multer from "multer";
import path from "path";
import { 
    getInventory, 
    createInventory, 
    updateInventory, 
    deleteInventory, 
    approveInventory 
} from "../controllers/Inventory.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { checkRole } from "../middleware/roleVerify.js";

const router = express.Router();

// ==========================================
// KONFIGURASI MULTER (UNTUK UPLOAD GAMBAR)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Folder tujuan penyimpanan gambar (pastikan folder ini ada di backend Anda)
        cb(null, './public/uploads/'); 
    },
    filename: function (req, file, cb) {
        // Membuat nama file unik agar tidak bentrok jika ada gambar bernama sama
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware multer untuk mencegat form-data
const upload = multer({ storage: storage });

// ==========================================
// DAFTAR RUTE INVENTARIS
// ==========================================

// READ: Semua role (admin, operator, user) bisa melihat data
router.get("/inventory", verifyToken, getInventory);

// CREATE: HANYA OPERATOR (Status otomatis PENDING)
// upload.single("image") mencegat file gambar dan mengekstrak req.body
router.post("/inventory", verifyToken, checkRole(['operator']), upload.single("image"), createInventory);

// UPDATE: HANYA OPERATOR (Status otomatis kembali PENDING)
// upload.single("image") mencegat file gambar dan mengekstrak req.body
router.put("/inventory/:id", verifyToken, checkRole(['operator']), upload.single("image"), updateInventory);

// DELETE: HANYA OPERATOR (Soft delete, status is_active = 0)
router.delete("/inventory/:id", verifyToken, checkRole(['operator']), deleteInventory);

// APPROVAL: SANGAT KETAT, HANYA ADMIN
router.put("/inventory/approve/:id", verifyToken, checkRole(['admin']), approveInventory);

export default router;