import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

export const getValuationReport = async (req, res) => {
    try {
        // Hanya hitung barang yang AKTIF, APPROVED, dan STOK > 0
        const query = `
            SELECT 
                sku, 
                name, 
                item_type, 
                category, 
                stock, 
                standard_cost_base, 
                (stock * standard_cost_base) AS total_value
            FROM inventory_items 
            WHERE is_active = 1 AND approval_status = 'APPROVED' AND stock > 0
            ORDER BY total_value DESC
        `;
        const items = await db.query(query, { type: QueryTypes.SELECT });

        res.json(items);
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ msg: "Gagal mengambil data laporan" });
    }
};