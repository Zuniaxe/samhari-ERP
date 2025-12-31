import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({ where: { username: req.body.username } });
        if(!user) return res.status(404).json({msg: "Username tidak ditemukan"});
        // --- DEBUGGING START ---
        console.log("Input dari Frontend:", req.body.password);
        console.log("Hash di Database   :", user.password_hash);
        // --- DEBUGGING END ---

        const match = await bcrypt.compare(req.body.password, user.password_hash);
        if(!match) return res.status(400).json({msg: "Password Salah"});

        const userId = user.id;
        const name = user.full_name;
        const email = user.email;

        // Buat Token
        const accessToken = jwt.sign({userId, name, email}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1d' // Token berlaku 1 hari
        });

        // Kirim token ke frontend
        res.json({ accessToken, user: { name, email, role: 'Administrator' } }); // Role dummy dulu
    } catch (error) {
        res.status(500).json({msg: "Terjadi kesalahan server"});
    }
}

export const Me = async (req, res) => {
    // Fungsi untuk cek user siapa yang sedang login (dipakai frontend nanti)
    if(!req.email) return res.status(401).json({msg: "Mohon login"});
    const user = await Users.findOne({ where: { email: req.email }, attributes:['id','full_name','email'] });
    if(!user) return res.status(404).json({msg: "User tidak valid"});
    res.json(user);
}