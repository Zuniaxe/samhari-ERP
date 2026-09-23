import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";
import router from "./routes/index.js";
import ReportsRoute from "./routes/ReportsRoute.js";
import OperationsRoute from "./routes/OperationsRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js";

dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log('Database Connected...');
} catch (error) {
    console.error(error);
}

// 1. Atur CORS (Tambahkan 127.0.0.1 untuk jaga-jaga)
app.use(cors({ 
    credentials: true, 
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] 
})); 

// 2. Parser Middleware (HARUS di atas semua route)
app.use(cookieParser());
app.use(express.json()); // Saya pindahkan ke atas agar req.body selalu terbaca

// 3. Static Files
app.use(express.static("public"));

// 4. Routes
app.use(ReportsRoute);
app.use(OperationsRoute); // <-- TAMBAHKAN BARIS INI
app.use(DashboardRoute);
app.use(router);

app.listen(process.env.APP_PORT, ()=> console.log(`Server running at port ${process.env.APP_PORT}`));
