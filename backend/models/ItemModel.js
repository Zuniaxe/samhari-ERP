import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const InventoryItems = db.define('inventory_items', {
    sku: DataTypes.STRING,
    name: DataTypes.STRING,
    variant: DataTypes.STRING,
    category: DataTypes.STRING,
    item_type: DataTypes.STRING,
    stock: DataTypes.INTEGER,
    unit: DataTypes.STRING,
    last_purchase_price: DataTypes.DECIMAL(10,0), // Disesuaikan dengan SQL Anda
    standard_cost_base: DataTypes.DECIMAL(10,0),  // Disesuaikan dengan SQL Anda
    image_path: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    approval_status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'APPROVED'
    },
    approved_by: DataTypes.INTEGER
}, {
    freezeTableName: true,
    timestamps: true // Memastikan Sequelize membaca kolom createdAt dan updatedAt Anda
});

export default InventoryItems;