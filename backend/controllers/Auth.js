import db from "../config/Database.js"; 
import { QueryTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ==========================================
// 1. LOGIN
// ==========================================
export const Login = async (req, res) => {
    try {
        // PERBAIKAN: Ambil langsung dari kolom 'role' di tabel 'users'
        const users = await db.query(`
            SELECT id, username, full_name, email, password_hash, role
            FROM users 
            WHERE username = :username 
            LIMIT 1
        `, {
            replacements: { username: req.body.username },
            type: QueryTypes.SELECT
        });

        const user = users[0]; 

        if(!user) return res.status(404).json({msg: "Username tidak ditemukan"});

        const match = await bcrypt.compare(req.body.password, user.password_hash);
        if(!match) return res.status(400).json({msg: "Password Salah"});

        const userId = user.id;
        const name = user.full_name;
        const email = user.email;
        // PERBAIKAN: Pastikan role menjadi lowercase agar cocok dengan middleware RBAC
        const role = user.role ? user.role.toLowerCase() : "user"; 

        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error("ERROR: ACCESS_TOKEN_SECRET tidak ditemukan di .env");
            return res.status(500).json({msg: "Konfigurasi server bermasalah (.env missing)"});
        }

        // Token sekarang AKURAT membawa role yang tepat (admin/operator/user)
        const accessToken = jwt.sign({userId, name, email, role}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1d'
        });

        res.json({ accessToken, user: { name, email, role } }); 

    } catch (error) {
        console.error("Login Error:", error); 
        res.status(500).json({msg: "Terjadi kesalahan server"});
    }
}

// ==========================================
// 2. ME (GET CURRENT LOGGED IN USER)
// ==========================================
export const Me = async (req, res) => {
    // req.email didapatkan dari middleware VerifyToken.js
    if(!req.email) return res.status(401).json({msg: "Mohon login terlebih dahulu"});
    
    try {
        // PERBAIKAN: Tambahkan pengambilan kolom 'role' agar bisa dibaca Frontend
        const users = await db.query(`
            SELECT id, username, full_name, email, role 
            FROM users 
            WHERE email = :email 
            LIMIT 1
        `, {
            replacements: { email: req.email },
            type: QueryTypes.SELECT
        });
        
        const user = users[0];
        
        if(!user) return res.status(404).json({msg: "User tidak valid"});
        
        res.json(user);
    } catch (error) {
        console.error("Me Error:", error);
        res.status(500).json({msg: "Terjadi kesalahan server"});
    }
}