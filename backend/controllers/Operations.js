import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

// ==========================================
// 1. MENGAMBIL RIWAYAT TRANSAKSI (DENGAN HARGA)
// ==========================================
export const getStockMovements = async (req, res) => {
    try {
        const query = `
            SELECT 
                sm.id, sm.movement_type, sm.qty, sm.reference_number, sm.notes, sm.created_at,
                i.sku, i.name as item_name, i.unit, i.standard_cost_base,
                u.full_name as operator_name
            FROM stock_movements sm
            LEFT JOIN inventory_items i ON sm.item_id = i.id
            LEFT JOIN users u ON sm.created_by = u.id
            ORDER BY sm.created_at DESC
        `;
        const result = await db.query(query, { type: QueryTypes.SELECT });
        res.json(result);
    } catch (error) {
        console.error("Error fetching operations:", error);
        res.status(500).json({ msg: "Gagal mengambil riwayat transaksi" });
    }
};

// ... (Biarkan fungsi createStockMovement / lainnya di bawahnya tetap ada)

// 2. MEMBUAT TRANSAKSI MANUAL (HANYA ADMIN)
export const createManualTransaction = async (req, res) => {
    try {
        const { item_id, movement_type, qty, notes, reference_number } = req.body;
        const adminId = req.userId || 1;

        if (!item_id || !qty || qty <= 0) {
            return res.status(400).json({ msg: "Item dan kuantitas harus diisi dengan benar." });
        }

        // A. Catat ke stock_movements
        await db.query(
            `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, qty, reference_number, notes, created_by, created_at) 
             VALUES (:item_id, 1, :movement_type, :qty, :reference_number, :notes, :adminId, NOW())`,
            { replacements: { 
                item_id, movement_type, qty, 
                reference_number: reference_number || `MNL-${Date.now()}`, 
                notes: notes || 'Manual Adjustment', 
                adminId 
            }, type: QueryTypes.INSERT }
        );

        // B. Update stok di inventory_items (tambah jika IN, kurang jika OUT)
        const operator = movement_type === 'IN' ? '+' : '-';
        await db.query(
            `UPDATE inventory_items SET stock = stock ${operator} :qty, updatedAt = NOW() WHERE id = :item_id`,
            { replacements: { qty, item_id }, type: QueryTypes.UPDATE }
        );

        res.status(201).json({ msg: "Transaksi manual berhasil dicatat." });
    } catch (error) {
        console.error("Manual Transaction Error:", error);
        res.status(500).json({ msg: "Gagal mencatat transaksi manual." });
    }
};