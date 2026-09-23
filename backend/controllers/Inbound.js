import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

export const getInboundReceipts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                r.id, r.receipt_no, r.receipt_date, r.status,
                s.name as supplier_name,
                w.name as warehouse_name,
                (SELECT COUNT(*) FROM inbound_receipt_lines WHERE receipt_id = r.id) as total_items
            FROM inbound_receipts r
            LEFT JOIN suppliers s ON r.supplier_id = s.id
            LEFT JOIN warehouses w ON r.warehouse_id = w.id
            WHERE r.receipt_no LIKE :search OR s.name LIKE :search
            ORDER BY r.created_at DESC
            LIMIT :limit OFFSET :offset
        `;

        const result = await db.query(query, {
            replacements: { limit: parseInt(limit), offset: parseInt(offset), search: `%${search}%` },
            type: QueryTypes.SELECT
        });

        res.json({ result, page, limit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server Error" });
    }
};

export const createInbound = async (req, res) => {
    const t = await db.transaction();
    try {
        const { receipt_date, supplier_id, warehouse_id, notes, items } = req.body;
        const userId = req.userId || 1; 

        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const receiptNo = `INB-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

        const [receiptId] = await db.query(
            `INSERT INTO inbound_receipts 
            (receipt_no, receipt_date, source_type, supplier_id, warehouse_id, received_by_user_id, notes, status) 
            VALUES (:no, :date, 'SUPPLIER', :supId, :whId, :userId, :notes, 'POSTED')`,
            {
                replacements: { 
                    no: receiptNo, date: receipt_date, supId: supplier_id, 
                    whId: warehouse_id, userId: userId, notes: notes 
                },
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        for (let item of items) {
            await db.query(
                `INSERT INTO inbound_receipt_lines 
                (receipt_id, item_id, qty_input, uom_input_id, qty_base, unit_price_input, total_amount) 
                VALUES (:rid, :itemId, :qty, :uomId, :qty, :price, :total)`,
                {
                    replacements: {
                        rid: receiptId, itemId: item.item_id, 
                        qty: item.qty, uomId: item.unit_id,
                        price: item.price, total: item.qty * item.price
                    },
                    type: QueryTypes.INSERT, transaction: t
                }
            );

            await db.query(
                `INSERT INTO stock_levels (warehouse_id, item_id, qty_good) 
                 VALUES (:whId, :itemId, :qty)
                 ON DUPLICATE KEY UPDATE qty_good = qty_good + :qty`,
                {
                    replacements: { whId: warehouse_id, itemId: item.item_id, qty: item.qty },
                    type: QueryTypes.INSERT, transaction: t
                }
            );

            await db.query(
                `INSERT INTO stock_movements 
                (movement_datetime, warehouse_id, item_id, qty_good_delta, ref_type, ref_id, created_by_user_id) 
                VALUES (NOW(), :whId, :itemId, :qty, 'INBOUND', :rid, :userId)`,
                {
                    replacements: { 
                        whId: warehouse_id, itemId: item.item_id, 
                        qty: item.qty, rid: receiptId, userId: userId 
                    },
                    type: QueryTypes.INSERT, transaction: t
                }
            );

            await db.query(
                `INSERT INTO item_costs (warehouse_id, item_id, last_purchase_price_base) 
                 VALUES (:whId, :itemId, :price)
                 ON DUPLICATE KEY UPDATE last_purchase_price_base = :price`,
                {
                    replacements: { whId: warehouse_id, itemId: item.item_id, price: item.price },
                    type: QueryTypes.INSERT, transaction: t
                }
            );
        }

        await t.commit();
        res.status(201).json({ msg: "Inbound Receipt Posted Successfully", receipt_no: receiptNo });

    } catch (error) {
        await t.rollback();
        console.error("Inbound Error:", error);
        res.status(500).json({ msg: "Transaction Failed: " + error.message });
    }
};