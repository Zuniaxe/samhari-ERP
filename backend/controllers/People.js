import db from "../config/Database.js";
import { QueryTypes } from "sequelize";
import bcrypt from "bcrypt";

// --- GET PEOPLE ---
export const getPeople = async (req, res) => {
    try {
        const { type, page = 1, limit = 10, search = "" } = req.query;
        const offset = (page - 1) * limit;
        let query = "";
        let countQuery = "";
        let replacements = { limit: parseInt(limit), offset: parseInt(offset), search: `%${search}%` };

        if (type === 'EMPLOYEE') {
            query = `SELECT id, employee_code, name, email, role, phone, status 
                     FROM employees 
                     WHERE name LIKE :search 
                     LIMIT :limit OFFSET :offset`;
            countQuery = `SELECT COUNT(*) as total FROM employees WHERE name LIKE :search`;
        } else {
            // SUPPLIER (Mencari berdasarkan kolom 'status')
            query = `SELECT * FROM suppliers 
                     WHERE name LIKE :search AND status = 'ACTIVE'
                     LIMIT :limit OFFSET :offset`;
            countQuery = `SELECT COUNT(*) as total FROM suppliers WHERE name LIKE :search AND status = 'ACTIVE'`;
        }

        const result = await db.query(query, { replacements, type: QueryTypes.SELECT });
        const totalResult = await db.query(countQuery, { replacements, type: QueryTypes.SELECT });
        
        res.json({
            result,
            totalRows: totalResult[0]?.total || 0,
            totalPage: Math.ceil((totalResult[0]?.total || 0) / limit),
            page: parseInt(page)
        });
    } catch (error) {
        console.error("GET ERROR:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

// --- CREATE ---
export const createPerson = async (req, res) => {
    try {
        const { type, ...data } = req.body;

        if (type === 'EMPLOYEE') {
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash("123456", salt);
            const randomCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);

            await db.query(
                `INSERT INTO employees (employee_code, name, email, password, role, phone, status) 
                 VALUES (:empCode, :name, :email, :pass, :role, :phone, 'ACTIVE')`,
                { replacements: { ...data, pass: hashPassword, empCode: randomCode }, type: QueryTypes.INSERT }
            );
        } else {
            // SUPPLIER (Menggunakan supplier_code dan status)
            const randomSupCode = "SUP-" + Math.floor(1000 + Math.random() * 9000);

            await db.query(
                `INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address, status) 
                 VALUES (:supCode, :name, :contact, :phone, :email, :address, 'ACTIVE')`,
                { replacements: { ...data, supCode: randomSupCode }, type: QueryTypes.INSERT }
            );
        }
        res.status(201).json({ msg: "Created Successfully" });
    } catch (error) {
        console.error("ERROR SAAT SAVE:", error); 
        res.status(500).json({ msg: error.message });
    }
};

// --- UPDATE ---
export const updatePerson = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, ...data } = req.body;

        if (type === 'EMPLOYEE') {
            await db.query(
                `UPDATE employees SET name=:name, email=:email, role=:role, phone=:phone WHERE id=:id`,
                { replacements: { ...data, id }, type: QueryTypes.UPDATE }
            );
        } else {
            await db.query(
                `UPDATE suppliers SET name=:name, contact_person=:contact, phone=:phone, email=:email, address=:address WHERE id=:id`,
                { replacements: { ...data, id }, type: QueryTypes.UPDATE }
            );
        }
        res.json({ msg: "Updated Successfully" });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        res.status(500).json({ msg: "Update Failed" });
    }
};

// --- DELETE ---
export const deletePerson = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        if (type === 'EMPLOYEE') {
            await db.query(`DELETE FROM employees WHERE id=:id`, { replacements: { id }, type: QueryTypes.DELETE });
        } else {
            // Soft delete supplier: ubah status jadi INACTIVE
            await db.query(`UPDATE suppliers SET status='INACTIVE' WHERE id=:id`, { replacements: { id }, type: QueryTypes.UPDATE });
        }
        res.json({ msg: "Deleted Successfully" });
    } catch (error) {
        console.error("DELETE ERROR:", error);
        res.status(500).json({ msg: "Delete Failed" });
    }
};