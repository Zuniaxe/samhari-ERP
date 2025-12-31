import InventoryItems from "../models/ItemModel.js";

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Ambil data Real dari Database
        const totalItems = await InventoryItems.count();
        
        // Ambil 5 barang pertama sebagai contoh "Critical Stock" (Simulasi Logic)
        const criticalItems = await InventoryItems.findAll({
            limit: 5,
            attributes: ['id', 'name', 'sku']
        });

        // Data Grafik (Hardcode sementara karena butuh tabel transaksi yg kompleks)
        // Tapi setidaknya data tabel di bawah diambil dari DB Item
        const data = {
            summary: {
                totalAsset: `Rp ${(totalItems * 150000).toLocaleString('id-ID')}`, // Simulasi hitung aset
                lowStock: 5, 
                inbound: 24,
                outbound: 18
            },
            weeklyUsage: [
                { name: 'Mon', leather: 120, rubber: 80, fabric: 60 },
                { name: 'Tue', leather: 98, rubber: 70, fabric: 55 },
                { name: 'Wed', leather: 140, rubber: 90, fabric: 70 },
                { name: 'Thu', leather: 130, rubber: 85, fabric: 65 },
                { name: 'Fri', leather: 160, rubber: 100, fabric: 80 },
                { name: 'Sat', leather: 90, rubber: 60, fabric: 45 },
                { name: 'Sun', leather: 45, rubber: 30, fabric: 20 },
            ],
            // Mapping data database ke format tabel dashboard
            criticalStock: criticalItems.map(item => ({
                id: item.id,
                name: item.name,
                stock: Math.floor(Math.random() * 50) + 1, // Simulasi stok acak
                unit: item.name.includes("Leather") ? "sq.ft" : "pcs"
            })),
            recentActivity: [
                { id: 1, title: "Premium Leather - Brown", desc: "Received from PT. Leather Indo", time: "2 hours ago", type: "in", val: "+250 sq.ft" },
                { id: 2, title: "Gladiator Sandal - Black", desc: "Shipped to Toko Sepatu Jakarta", time: "3 hours ago", type: "out", val: "-15 pairs" },
                { id: 3, title: "EVA Rubber Sole - Black", desc: "Taken by Budi Santoso", time: "4 hours ago", type: "out", val: "-120 pairs" },
            ]
        };

        res.json(data);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}