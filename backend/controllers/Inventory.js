import db from "../config/Database.js";
import { QueryTypes } from "sequelize";

// ==========================================
// 1. GET INVENTORY (BACA DATA)
// ==========================================
// ==========================================
// 1. GET INVENTORY (VISIBILITAS BERDASARKAN ROLE & DINAMIS)
// ==========================================
export const getInventory = async (req, res) => {
    try {
        const { type, page = 1, limit = 10, search = "", id, ...filters } = req.query;
        const userRole = req.role ? req.role.toLowerCase() : 'user';

        if (id && type === 'SAMPLING_DETAIL') {
            try {
                const bom = await db.query(
                    `SELECT sbl.*, i.name as material_name, i.unit as unit, i.standard_cost_base 
                     FROM sample_bom_lines sbl
                     JOIN inventory_items i ON sbl.raw_item_id = i.id
                     WHERE sbl.sample_id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                return res.json(bom);
            } catch (err) { return res.json([]); }
        }

        const offset = (page - 1) * limit;
        
        // PERBAIKAN: Kita pisahkan 'type' agar tidak error jika Frontend tidak mengirimkannya
        let replacements = { limit: parseInt(limit), offset: parseInt(offset), search: `%${search}%` };
        let whereClause = "WHERE name LIKE :search";

        // Jika 'type' dikirim (RAW/FINISHED), tambahkan ke query. Jika tidak, abaikan.
        if (type) {
            whereClause += " AND item_type = :type";
            replacements.type = type;
        }

        // Admin & Operator melihat semua (Aktif & PENDING). User hanya melihat (Aktif & APPROVED).
        if (userRole === 'admin' || userRole === 'operator') {
            whereClause += " AND (is_active = 1 OR approval_status = 'PENDING')";
        } else {
            whereClause += " AND approval_status = 'APPROVED' AND is_active = 1";
        }

        if (type === 'RAW' && filters.categories) {
            whereClause += " AND category IN (:categories)";
            replacements.categories = filters.categories.split(',');
        }

        const query = `SELECT * FROM inventory_items ${whereClause} ORDER BY createdAt DESC LIMIT :limit OFFSET :offset`;
        const countQuery = `SELECT COUNT(*) as total FROM inventory_items ${whereClause}`;

        const result = await db.query(query, { replacements, type: QueryTypes.SELECT });
        const totalResult = await db.query(countQuery, { replacements, type: QueryTypes.SELECT });
        
        res.json({
            result: result,
            page: parseInt(page),
            limit: parseInt(limit),
            totalRows: totalResult[0]?.total || 0,
            totalPage: Math.ceil((totalResult[0]?.total || 0) / limit)
        });
    } catch (error) {
        console.error("Error getting inventory:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

// ==========================================
// 2. CREATE INVENTORY (HANYA OPERATOR)
// ==========================================
export const createInventory = async (req, res) => {
    try {
        const { item_type, ...data } = req.body;
        const imagePath = req.file ? req.file.filename : null;

        // Karena HANYA operator yang bisa mengakses ini, status PASTI pending
        const initialStatus = 'PENDING';
        const isActiveStatus = 0;

        let materials = data.materials;
        if (typeof materials === 'string') {
            try { materials = JSON.parse(materials); } catch (e) { materials = []; }
        }

        if (item_type === 'RAW') {
            const sku = "RAW-" + Date.now(); 
            await db.query(
                `INSERT INTO inventory_items (sku, name, item_type, category, unit, standard_cost_base, stock, is_active, approval_status, image_path, createdAt, updatedAt) 
                 VALUES (:sku, :name, 'RAW', :category, :unit, :cost, :stock, :isActive, :status, :image, NOW(), NOW())`,
                { 
                    replacements: { 
                        sku, name: data.name, category: data.category, unit: data.unit, 
                        cost: data.standard_cost_base || 0, stock: data.stock || 0, 
                        isActive: isActiveStatus, status: initialStatus, image: imagePath 
                    }, type: QueryTypes.INSERT 
                }
            );
        }
        else if (item_type === 'FINISHED') {
            // ... (Kode INSERT FINISHED sama seperti sebelumnya, pastikan is_active: isActiveStatus, status: initialStatus)
        }
        else if (item_type === 'SAMPLING') {
            // ... (Kode INSERT SAMPLING sama seperti sebelumnya)
        }

        res.status(201).json({ msg: "Data berhasil diajukan dan menunggu persetujuan Admin." });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ msg: error.message });
    }
};

// ==========================================
// 3. UPDATE INVENTORY (OPERATOR HANYA MENGAJUKAN)
// ==========================================
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_type, ...data } = req.body;
        
        // REVISI: Ubah status menjadi PENDING_UPDATE
        const newStatus = 'PENDING_UPDATE';
        let imageQueryPart = "";
        let replacements = { id, name: data.name, status: newStatus };
        
        if (req.file) {
            imageQueryPart = ", image_path = :image";
            replacements.image = req.file.filename;
        }

        if (item_type === 'RAW') {
             replacements = { ...replacements, category: data.category, unit: data.unit, cost: data.standard_cost_base || 0, stock: data.stock || 0 };
             await db.query(
                `UPDATE inventory_items SET name=:name, category=:category, unit=:unit, standard_cost_base=:cost, stock=:stock, approval_status=:status ${imageQueryPart}, updatedAt=NOW() WHERE id=:id`,
                { replacements, type: QueryTypes.UPDATE }
            );
        } else if (item_type === 'FINISHED') {
            replacements = { ...replacements, variant: `${data.model || ''} ${data.color || ''} - Size ${data.size || ''}`.trim(), base_cost: data.base_cost || 0, selling_price: data.selling_price || 0, stock: data.stock || 0 };
            await db.query(
                `UPDATE inventory_items SET name=:name, variant=:variant, standard_cost_base=:base_cost, last_purchase_price=:selling_price, stock=:stock, approval_status=:status ${imageQueryPart}, updatedAt=NOW() WHERE id=:id`,
                { replacements, type: QueryTypes.UPDATE }
            );
        }

        res.json({ msg: "Perubahan diajukan! Menunggu ACC Admin." });
    } catch (error) { res.status(500).json({ msg: "Update failed" }); }
};

// ==========================================
// 4. DELETE INVENTORY (OPERATOR HANYA MENGAJUKAN)
// ==========================================
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        // REVISI: Tidak langsung Outbound, hanya ganti status!
        await db.query(
            `UPDATE inventory_items SET approval_status = 'PENDING_DELETE', updatedAt=NOW() WHERE id = :id`, 
            { replacements: { id }, type: QueryTypes.UPDATE }
        );
        res.json({ msg: "Permintaan Hapus diajukan! Menunggu ACC Admin." });
    } catch (error) { res.status(500).json({ msg: "Failed to delete" }); }
};

// ==========================================
// 5. APPROVE INVENTORY (ADMIN LOGIC TERPUSAT)
// ==========================================
export const approveInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; 
        const adminId = req.userId || 1; 

        if (action !== 'APPROVED' && action !== 'REJECTED') {
            return res.status(400).json({ msg: "Aksi tidak valid." });
        }

        // 1. CEK DULU STATUS BARANG SAAT INI
        const items = await db.query(
            `SELECT id, stock, standard_cost_base, approval_status FROM inventory_items WHERE id = :id`, 
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        const item = items[0];
        if (!item) return res.status(404).json({ msg: "Item not found" });

        const currentStatus = item.approval_status;

        // 2. JIKA ADMIN MENOLAK (REJECT)
        if (action === 'REJECTED') {
            // Kembalikan ke status aktif jika tadinya mau di-update/delete
            const revertStatus = (currentStatus === 'PENDING_UPDATE' || currentStatus === 'PENDING_DELETE') ? 'APPROVED' : 'REJECTED';
            await db.query(`UPDATE inventory_items SET approval_status = :status WHERE id = :id`, { replacements: { status: revertStatus, id }, type: QueryTypes.UPDATE });
            return res.json({ msg: "Permintaan ditolak." });
        }

        // 3. JIKA ADMIN MENYETUJUI (APPROVED)
        if (currentStatus === 'PENDING') {
            // A. BARU DIBUAT -> Aktifkan & Mutasi INBOUND
            await db.query(`UPDATE inventory_items SET approval_status = 'APPROVED', is_active = 1, approved_by = :adminId WHERE id = :id`, { replacements: { adminId, id }, type: QueryTypes.UPDATE });
            
            if (item.stock > 0) {
                await db.query(
                    `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, qty, reference_number, notes, created_by, created_at) VALUES (:itemId, 1, 'IN', :qty, :ref, 'Auto-Inbound (New Item Approved)', :adminId, NOW())`,
                    { replacements: { itemId: id, qty: item.stock, ref: `AUTO-APP-${id}`, adminId }, type: QueryTypes.INSERT }
                );
                await db.query(
                    `INSERT INTO cash_flows (transaction_type, amount, reference_type, reference_id, description, created_by) VALUES ('PENGELUARAN', :amount, 'INBOUND_APPROVAL', :itemId, 'Pengeluaran penambahan stok', :adminId)`,
                    { replacements: { amount: item.stock * (item.standard_cost_base || 0), itemId: id, adminId }, type: QueryTypes.INSERT }
                );
            }
        } 
        else if (currentStatus === 'PENDING_UPDATE') {
            // B. DIEDIT -> Aktifkan kembali TANPA Mutasi
            await db.query(`UPDATE inventory_items SET approval_status = 'APPROVED', is_active = 1, approved_by = :adminId WHERE id = :id`, { replacements: { adminId, id }, type: QueryTypes.UPDATE });
        } 
        else if (currentStatus === 'PENDING_DELETE') {
            // C. DIHAPUS -> Nonaktifkan & Mutasi OUTBOUND
            await db.query(`UPDATE inventory_items SET approval_status = 'DELETED', is_active = 0, approved_by = :adminId WHERE id = :id`, { replacements: { adminId, id }, type: QueryTypes.UPDATE });
            
            if (item.stock > 0) {
                await db.query(
                    `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, qty, reference_number, notes, created_by, created_at) VALUES (:itemId, 1, 'OUT', :qty, :ref, 'Auto-Outbound (Item Deleted)', :adminId, NOW())`,
                    { replacements: { itemId: id, qty: item.stock, ref: `AUTO-DEL-${id}`, adminId }, type: QueryTypes.INSERT }
                );
                await db.query(
                    `INSERT INTO cash_flows (transaction_type, amount, reference_type, reference_id, description, created_by) VALUES ('PEMASUKAN', :amount, 'OUTBOUND_DELETE', :itemId, 'Pemasukan dari pengurangan aset', :adminId)`,
                    { replacements: { amount: item.stock * (item.standard_cost_base || 0), itemId: id, adminId }, type: QueryTypes.INSERT }
                );
            }
        }

        res.json({ msg: `Item berhasil di-ACC.` });
    } catch (error) { res.status(500).json({ msg: "Gagal memproses persetujuan." }); }
};