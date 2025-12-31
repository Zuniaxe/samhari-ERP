import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";
import router from "./routes/index.js";

dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log('Database Connected...');
} catch (error) {
    console.error(error);
}

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:5173' })); // Port Frontend Vite
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.listen(process.env.APP_PORT, ()=> console.log(`Server running at port ${process.env.APP_PORT}`));