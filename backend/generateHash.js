// backend/generateHash.js
import bcrypt from "bcrypt";

(async () => {
    const passwordPlain = "admin123"; // <--- GANTI JADI INI
    const hash = await bcrypt.hash(passwordPlain, 10);
    console.log("HASH BARU:", hash);
})();