import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const InventoryItems = db.define('inventory_items', {
    sku: DataTypes.STRING,
    name: DataTypes.STRING,
    variant: DataTypes.STRING, // Tambahan untuk Finished Goods
    category: DataTypes.STRING, // Tambahan untuk Badge
    item_type: DataTypes.STRING, 
    stock: DataTypes.INTEGER, // Tambahan stok langsung di item untuk simplifikasi
    unit: DataTypes.STRING,
    last_purchase_price: DataTypes.DECIMAL, // Tambahan sesuai UI
    standard_cost_base: DataTypes.DECIMAL,
    image_path: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN
}, {
    freezeTableName: true
});

export default InventoryItems;