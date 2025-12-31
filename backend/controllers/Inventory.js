import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

// --- GET ITEMS (Handle 3 Tabs: RAW, FINISHED, SAMPLING) ---
export const getInventory = async (req, res) => {
    try {
        const { type, page = 1, limit = 10, search = "", ...filters } = req.query;
        const offset = (page - 1) * limit;
        let query = "";
        let countQuery = "";
        
        // Default replacements
        let replacements = { 
            limit: parseInt(limit), 
            offset: parseInt(offset), 
            search: `%${search}%` 
        };

        // 1. RAW MATERIALS
        if (type === 'RAW') {
            let whereClause = "WHERE name LIKE :search";
            
            // Filter Categories
            if (filters.categories && filters.categories !== "") {
                whereClause += " AND category IN (:categories)";
                replacements.categories = filters.categories.split(',');
            }
            // Filter Stock Level
            if (filters.stockLevel === 'LOW') {
                whereClause += " AND current_stock < 100"; // Contoh logic low stock
            }

            query = `SELECT * FROM vw_raw_materials_list ${whereClause} LIMIT :limit OFFSET :offset`;
            countQuery = `SELECT COUNT(*) as total FROM vw_raw_materials_list ${whereClause}`;
        } 
        
        // 2. FINISHED GOODS
        else if (type === 'FINISHED') {
            let whereClause = "WHERE product_name LIKE :search";
            
            // Filter Model (jika ada dropdown model nanti)
            if (filters.model) {
                whereClause += " AND model_name = :model";
                replacements.model = filters.model;
            }
            
            query = `SELECT * FROM vw_finished_goods_list ${whereClause} LIMIT :limit OFFSET :offset`;
            countQuery = `SELECT COUNT(*) as total FROM vw_finished_goods_list ${whereClause}`;
        } 
        
        // 3. SAMPLING
        else if (type === 'SAMPLING') {
            let whereClause = "WHERE name LIKE :search";
            
            // Filter Status
            if (filters.status) {
                whereClause += " AND status = :status";
                replacements.status = filters.status;
            }

            query = `SELECT * FROM vw_samples_list ${whereClause} LIMIT :limit OFFSET :offset`;
            countQuery = `SELECT COUNT(*) as total FROM vw_samples_list ${whereClause}`;
        }
        // Default Fallback
        else {
             return res.status(400).json({ msg: "Invalid Item Type" });
        }

        const result = await db.query(query, { replacements, type: QueryTypes.SELECT });
        const totalResult = await db.query(countQuery, { replacements, type: QueryTypes.SELECT });
        
        const totalRows = totalResult[0]?.total || 0;
        const totalPage = Math.ceil(totalRows / limit);

        res.json({
            result: result,
            page: parseInt(page),
            limit: parseInt(limit),
            totalRows: totalRows,
            totalPage: totalPage
        });

    } catch (error) {
        console.error("Error getting inventory:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

// --- CREATE ITEM (Handle POST untuk 3 Tipe) ---
export const createInventory = async (req, res) => {
    const t = await db.transaction(); // Wajib pakai transaction
    try {
        const { item_type, ...data } = req.body;

        // A. CREATE RAW MATERIAL
        if (item_type === 'RAW') {
             // Logic insert raw material (sesuai kode lama/database)
             const [newItem] = await db.query(
                `INSERT INTO inventory_items (name, sku, item_type, category_id, base_uom_id, standard_cost_base, is_active) 
                 VALUES (:name, :sku, 'RAW', (SELECT id FROM item_categories WHERE name=:category LIMIT 1), 
                 (SELECT id FROM uoms WHERE code=:unit LIMIT 1), :cost, 1)`,
                { 
                    replacements: { 
                        name: data.name, 
                        sku: "RAW-" + Date.now(), // Simple auto SKU
                        category: data.category, 
                        unit: data.unit, 
                        cost: data.standard_cost_base 
                    },
                    type: QueryTypes.INSERT, transaction: t 
                }
            );
            
            // Insert Initial Stock jika ada
            if(data.stock > 0) {
                await db.query(
                    `INSERT INTO stock_levels (warehouse_id, item_id, qty_good) VALUES (1, :itemId, :qty)`,
                    { replacements: { itemId: newItem, qty: data.stock }, type: QueryTypes.INSERT, transaction: t }
                );
            }
        }

        // B. CREATE FINISHED GOODS
        else if (item_type === 'FINISHED') {
            // 1. Insert Parent Item
            const [newItem] = await db.query(
                `INSERT INTO inventory_items (name, sku, item_type, base_uom_id, image_path, standard_cost_base) 
                 VALUES (:name, :sku, 'FINISHED', (SELECT id FROM uoms WHERE code='pair' LIMIT 1), :image, :hpp)`,
                { 
                    replacements: { 
                        name: data.name, 
                        sku: "FG-" + Date.now(), 
                        image: data.image || null, 
                        hpp: data.base_cost 
                    },
                    type: QueryTypes.INSERT, transaction: t 
                }
            );

            // 2. Insert Variant (Warna/Size)
            // Note: Kita asumsikan model_id dikirim atau di-hardcode dulu jika belum ada table models yang lengkap
            // Disini saya pakai Select dummy model id 1 jika tidak ada
            const [newVariant] = await db.query(
                `INSERT INTO product_variants (model_id, item_id, color, size, variant_label) 
                 VALUES (1, :item_id, :color, :size, :label)`,
                { 
                    replacements: { 
                        item_id: newItem, 
                        color: data.color, 
                        size: data.size, 
                        label: `${data.name} - ${data.color} (${data.size})`
                    },
                    type: QueryTypes.INSERT, transaction: t 
                }
            );

            // 3. Insert Price
            await db.query(
                `INSERT INTO product_prices (variant_id, price, effective_from) VALUES (:var_id, :price, CURDATE())`,
                { replacements: { var_id: newVariant, price: data.selling_price }, type: QueryTypes.INSERT, transaction: t }
            );
        }

        // C. CREATE SAMPLING
        else if (item_type === 'SAMPLING') {
            // 1. Insert Sample Header
            const [newSample] = await db.query(
                `INSERT INTO samples (name, sample_code, status, created_by_user_id, image_path) 
                 VALUES (:name, :code, 'DRAFT', 1, :image)`,
                { 
                    replacements: { 
                        name: data.name, 
                        code: "SMPL-" + Date.now(), 
                        image: data.image || null
                    },
                    type: QueryTypes.INSERT, transaction: t 
                }
            );

            // 2. Insert Materials (BOM)
            if (data.materials && data.materials.length > 0) {
                for (let mat of data.materials) {
                    await db.query(
                        `INSERT INTO sample_bom_lines (sample_id, raw_item_id, qty_base, unit_cost_base, line_total) 
                         VALUES (:sid, :rid, :qty, :cost, :total)`,
                        {
                            replacements: {
                                sid: newSample,
                                rid: mat.id, // ID dari Raw Material
                                qty: mat.qty,
                                cost: mat.standard_cost_base || 0,
                                total: mat.qty * (mat.standard_cost_base || 0)
                            },
                            type: QueryTypes.INSERT, transaction: t 
                        }
                    );
                }
            }
        }

        await t.commit();
        res.status(201).json({ msg: "Data created successfully" });

    } catch (error) {
        await t.rollback();
        console.error("Create Inventory Error:", error);
        res.status(500).json({ msg: error.message });
    }
}