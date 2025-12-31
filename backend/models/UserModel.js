import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Users = db.define('users', {
    username: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    full_name: DataTypes.STRING,
    email: DataTypes.STRING,
    // Pastikan baris di bawah ini ADA dan TIDAK dikomentar
    refresh_token: DataTypes.TEXT 
}, {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Users;