import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

export const getDashboardSummary = async (req, res) => {
    try {
        // 1. Total Inventory Asset
        const assetQuery = `
            SELECT SUM(stock * standard_cost_base) as total_asset 
            FROM inventory_items 
            WHERE is_active = 1 AND approval_status = 'APPROVED'
        `;
        const assetRes = await db.query(assetQuery, { type: QueryTypes.SELECT });
        const totalAsset = assetRes[0]?.total_asset || 0;

        // 2. Material Low Stock (Stock < 10)
        const lowStockQuery = `
            SELECT COUNT(*) as low_count 
            FROM inventory_items 
            WHERE is_active = 1 AND approval_status = 'APPROVED' AND stock < 10
        `;
        const lowStockRes = await db.query(lowStockQuery, { type: QueryTypes.SELECT });
        const lowStockCount = lowStockRes[0]?.low_count || 0;

        // 3. Today's Inbound & Outbound Count
        const movementQuery = `
            SELECT 
                SUM(CASE WHEN movement_type = 'IN' THEN qty ELSE 0 END) as today_in,
                SUM(CASE WHEN movement_type = 'OUT' THEN qty ELSE 0 END) as today_out
            FROM stock_movements
            WHERE DATE(created_at) = CURDATE()
        `;
        const movementRes = await db.query(movementQuery, { type: QueryTypes.SELECT });
        const todayIn = movementRes[0]?.today_in || 0;
        const todayOut = movementRes[0]?.today_out || 0;

        // 4. Critical Stock Alerts (Barang dengan stok < 10)
        const criticalQuery = `
            SELECT id, name, stock, unit 
            FROM inventory_items 
            WHERE is_active = 1 AND approval_status = 'APPROVED' AND stock < 10 
            LIMIT 5
        `;
        const criticalItems = await db.query(criticalQuery, { type: QueryTypes.SELECT });

        // 5. Recent Warehouse Activity (Mengambil dari stock_movements)
        const activityQuery = `
            SELECT 
                sm.movement_type, sm.qty, sm.notes, sm.created_at,
                i.name as item_name, i.unit
            FROM stock_movements sm
            LEFT JOIN inventory_items i ON sm.item_id = i.id
            ORDER BY sm.created_at DESC
            LIMIT 5
        `;
        const recentActivities = await db.query(activityQuery, { type: QueryTypes.SELECT });

        res.json({
            totalAsset,
            lowStockCount,
            todayIn,
            todayOut,
            criticalItems,
            recentActivities
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ msg: "Gagal memuat ringkasan dashboard" });
    }
};