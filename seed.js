import bcrypt from "bcrypt";
import Users from "./models/UserModel.js"; // Pastikan path ini sesuai
import db from "./config/Database.js";

const createAdmin = async () => {
    try {
        // Perintah alter: true akan otomatis menambahkan kolom 'role' ke database MySQL Anda
        await db.sync({ alter: true }); 

        const salt = await bcrypt.genSalt();
        // Password yang akan Anda gunakan untuk login adalah "admin123"
        const hashPassword = await bcrypt.hash("admin123", salt);

        // Memasukkan data sesuai dengan kolom asli Anda
        await Users.create({
            username: "admin",
            password_hash: hashPassword,
            full_name: "Admin CV Samhari",
            email: "admin@samhari.com",
            role: "admin"
        });

        console.log("Berhasil! Kolom role ditambahkan & Akun Admin dibuat.");
        process.exit();
    } catch (error) {
        console.error("Gagal membuat admin:", error.message);
        process.exit(1);
    }
}

createAdmin();