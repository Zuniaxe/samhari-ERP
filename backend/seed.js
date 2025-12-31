import db from "./config/Database.js";
import InventoryItems from "./models/ItemModel.js";

(async () => {
    try {
        await db.authenticate();
        // Reset tabel agar bersih
        await InventoryItems.sync({ force: true }); 

        const dummyData = [
            // --- RAW MATERIALS (Page 1) ---
            { sku: "SKU-EVA-001", name: "Spons Eva 3mm Black", item_type: "RAW", category: "Sponge", stock: 5000, unit: "cm", last_purchase_price: 2000, standard_cost_base: 2500, is_active: true },
            { sku: "SKU-LTR-008", name: "Premium Leather Brown", item_type: "RAW", category: "Leather", stock: 750, unit: "cm", last_purchase_price: 3200, standard_cost_base: 3500, is_active: true },
            { sku: "SKU-GLU-015", name: "Industrial Adhesive Glue", item_type: "RAW", category: "Glue", stock: 250, unit: "kg", last_purchase_price: 125000, standard_cost_base: 130000, is_active: true },
            { sku: "SKU-FAB-022", name: "Cotton Fabric Strap Beige", item_type: "RAW", category: "Fabric", stock: 3200, unit: "cm", last_purchase_price: 1800, standard_cost_base: 2000, is_active: true },
            { sku: "SKU-RUB-033", name: "EVA Rubber Sheet 5mm", item_type: "RAW", category: "Rubber", stock: 4500, unit: "pcs", last_purchase_price: 8500, standard_cost_base: 9000, is_active: true },
            { sku: "SKU-LTR-041", name: "Synthetic Leather Tan", item_type: "RAW", category: "Leather", stock: 1800, unit: "cm", last_purchase_price: 2800, standard_cost_base: 3000, is_active: true },
            
            // --- RAW MATERIALS (Page 2 - Untuk mengetes Pagination) ---
            { sku: "SKU-GLU-052", name: "Contact Cement Premium", item_type: "RAW", category: "Glue", stock: 85, unit: "kg", last_purchase_price: 145000, standard_cost_base: 150000, is_active: true },
            { sku: "SKU-FAB-067", name: "Polyester Webbing Black", item_type: "RAW", category: "Fabric", stock: 2400, unit: "cm", last_purchase_price: 1500, standard_cost_base: 1800, is_active: true },
            
            // --- FINISHED GOODS ---
            { sku: "SKU-GLAD-BLK-40", name: "Gladiator Sandal", variant: "Black - Size 40", item_type: "FINISHED", category: "Casual Sandal", stock: 45, unit: "pairs", last_purchase_price: 35250, standard_cost_base: 75000, is_active: true },
            { sku: "SKU-GLAD-BLK-42", name: "Gladiator Sandal", variant: "Black - Size 42", item_type: "FINISHED", category: "Casual Sandal", stock: 38, unit: "pairs", last_purchase_price: 35250, standard_cost_base: 75000, is_active: true },
            { sku: "SKU-CLAS-BRN-39", name: "Classic Leather Sandal", variant: "Brown - Size 39", item_type: "FINISHED", category: "Formal Sandal", stock: 52, unit: "pairs", last_purchase_price: 42500, standard_cost_base: 95000, is_active: true },
             { sku: "SKU-CLAS-BRN-41", name: "Classic Leather Sandal", variant: "Brown - Size 41", item_type: "FINISHED", category: "Formal Sandal", stock: 18, unit: "pairs", last_purchase_price: 42500, standard_cost_base: 95000, is_active: true },

            // --- SAMPLING ---
            { sku: "SMP-PROTO-V1", name: "Prototype Gunung V1", item_type: "SAMPLING", category: "Prototype", stock: 1, unit: "set", last_purchase_price: 32000, standard_cost_base: 35200, is_active: true },
            { sku: "SMP-IDEA-2025", name: "Idea Japit 2025", item_type: "SAMPLING", category: "Concept", stock: 1, unit: "set", last_purchase_price: 28500, standard_cost_base: 31350, is_active: true },
        ];

        await InventoryItems.bulkCreate(dummyData);
        console.log("✅ Database berhasil di-update sesuai Screenshot Figma!");
    } catch (error) {
        console.error(error);
    }
})();