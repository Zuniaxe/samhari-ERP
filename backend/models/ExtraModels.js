import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import InventoryItems from "./ItemModel.js";

const { DataTypes } = Sequelize;

// Mapping tabel `samples` dari SQL Dump
export const Samples = db.define('samples', {
    sample_code: DataTypes.STRING,
    name: DataTypes.STRING,
    status: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
    created_by_user_id: DataTypes.INTEGER
}, { freezeTableName: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Mapping tabel `sample_bom_lines` dari SQL Dump
export const SampleBomLines = db.define('sample_bom_lines', {
    qty_base: DataTypes.DECIMAL,
    unit_cost_base: DataTypes.DECIMAL,
    line_total: DataTypes.DECIMAL
}, { freezeTableName: true, timestamps: false }); // SQL dump cuma punya created_at biasanya

// Relasi
Samples.hasMany(SampleBomLines, { foreignKey: 'sample_id', as: 'lines' });
SampleBomLines.belongsTo(Samples, { foreignKey: 'sample_id' });
SampleBomLines.belongsTo(InventoryItems, { foreignKey: 'raw_item_id', as: 'raw_material' });