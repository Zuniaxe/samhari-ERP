import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Printer, DollarSign, Package, TrendingUp } from "lucide-react";
import "./PrintReport.css";

const Reports = () => {
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState("ALL");

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            const response = await axios.get("/reports/valuation");
            setItems(response.data);
        } catch (error) {
            console.error("Gagal mengambil data laporan", error);
        }
    };

    const formatRp = (n) => "Rp " + parseInt(n || 0).toLocaleString('id-ID');

    // Filter data berdasarkan Tab
    const filteredItems = items.filter(item => {
        if (activeTab === "ALL") return true;
        return item.item_type === activeTab;
    });

    // Kalkulasi Dinamis untuk Card Summary
    const totalAssetValue = filteredItems.reduce((acc, curr) => acc + parseFloat(curr.total_value), 0);
    const totalSKUs = filteredItems.length;
    const highestValueItem = filteredItems.length > 0 ? filteredItems[0].name : '-';

    // Kelompokkan data berdasarkan kategori untuk mode Print (seperti Excel)
    const groupedForPrint = filteredItems.reduce((acc, curr) => {
        const cat = curr.category || 'GENERAL';
        if (!acc[cat]) {
            acc[cat] = { items: [], subtotalQty: 0 };
        }
        acc[cat].items.push(curr);
        acc[cat].subtotalQty += parseFloat(curr.stock || 0);
        return acc;
    }, {});

    let grandTotalNetto = filteredItems.reduce((acc, curr) => acc + parseFloat(curr.total_value || 0), 0);

    return (
        <div className="w-full min-h-screen bg-white font-sans text-gray-900 flex flex-col">
            {/* TAMPILAN DASHBOARD WEB UTAMA (TIDAK BERUBAH) */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Stock Valuation Report</h1>
                    <p className="text-sm text-gray-500">Financial summary of current inventory assets.</p>
                </div>
                <button onClick={() => window.print()} className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-gray-200">
                    <Printer size={16}/> Print Report
                </button>
            </div>

            <div className="p-8 bg-gray-50/30 flex-1">
                {/* TABS */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-max mb-6">
                    {[
                        { id: 'ALL', label: 'All Items' }, 
                        { id: 'RAW', label: 'Raw Materials' }, 
                        { id: 'FINISHED', label: 'Finished Goods' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Asset Value</span>
                            <DollarSign className="text-green-600" size={20}/>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">{formatRp(totalAssetValue)}</h2>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Items In Stock</span>
                            <Package className="text-blue-600" size={20}/>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">{totalSKUs} <span className="text-sm font-medium text-gray-400">SKUs</span></h2>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Highest Value Item</span>
                            <TrendingUp className="text-orange-500" size={20}/>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 truncate">{highestValueItem}</h2>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Item Name</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Unit Cost (HPP)</th>
                                <th className="py-4 px-4 pr-6 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-400 text-sm">No assets found in this category.</td></tr>
                            ) : filteredItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/80 transition group">
                                    <td className="py-4 pl-6 font-mono text-[10px] text-gray-400">{item.sku}</td>
                                    <td className="py-4 px-4 font-bold text-sm text-gray-900">{item.name}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${item.item_type === 'FINISHED' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.item_type === 'FINISHED' ? 'FINISHED' : item.category || 'RAW'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 font-bold text-sm text-gray-700">{item.stock}</td>
                                    <td className="py-4 px-4 font-mono text-xs text-gray-500">{formatRp(item.standard_cost_base)}</td>
                                    <td className="py-4 px-4 pr-6 text-right font-mono text-sm font-bold text-gray-900">{formatRp(item.total_value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* TEMPLATE KHUSUS CETAK (HANYA MUNCUL KETIKA DI-PRINT)          */}
            {/* ========================================================= */}
            <div className="print-only-container">
                <div className="po-header">
                    <div className="po-company">
                        <h1>CV. SAMHARI</h1>
                        <p>JL. BABAKAN TAROGONG GG. BOJONG ASIH RT 10/04</p>
                        <p>BENGKEL 2 : JL. BABAKAN TAROGONG NO. 158 BANDUNG</p>
                        <p>TELP. / FAX : 022 - 600 500 8</p>
                    </div>
                    <div className="po-to">
                        <p><strong>TO :</strong></p>
                        <p><strong>SANTO RUBBER FACTORY</strong></p>
                        <p>Kawasan Industri Kayu Besar E-4<br/>Jl. Kamal Raya Cengkareng-Jakarta 11520</p>
                    </div>
                </div>

                <div className="po-title-section">Stock Valuation & Purchase Order</div>

                <div className="po-meta">
                    <div>
                        <p>PO. NO : 1904/SH/0002</p>
                        <p>Delivery Date : {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                        <p>DATE : {new Date().toLocaleDateString('id-ID')}</p>
                        <p>Term Of Payment : 45 Hari</p>
                    </div>
                </div>

                <table className="po-table">
                    <thead>
                        <tr>
                            <th style={{width: "15%"}}>KODE BARANG</th>
                            <th style={{width: "35%"}}>Nama Barang</th>
                            <th style={{width: "10%", textAlign: "center"}}>QTY</th>
                            <th style={{width: "10%", textAlign: "center"}}>Satuan</th>
                            <th style={{width: "15%"}}>Harga</th>
                            <th style={{width: "15%", textAlign: "right"}}>Netto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedForPrint).map(([categoryName, group]) => (
                            <React.Fragment key={categoryName}>
                                <tr>
                                    <td colSpan="6" className="category-row">
                                        <strong>{categoryName}</strong>
                                    </td>
                                </tr>
                                {group.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.sku}</td>
                                        <td>{item.name}</td>
                                        <td style={{textAlign: "center"}}>{item.stock}</td>
                                        <td style={{textAlign: "center"}}>PCS</td>
                                        <td>{formatRp(item.standard_cost_base)}</td>
                                        <td style={{textAlign: "right"}}>{formatRp(item.total_value)}</td>
                                    </tr>
                                ))}
                                <tr className="subtotal-row">
                                    <td colSpan="2" style={{textAlign: "right"}}>SUBTOTAL</td>
                                    <td style={{textAlign: "center"}}>{group.subtotalQty.toFixed(1)}</td>
                                    <td style={{textAlign: "center"}}>PCS</td>
                                    <td colSpan="2"></td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                <div className="grand-total">
                    TOTAL : {formatRp(grandTotalNetto)} (+)
                </div>

                <div className="po-footer">
                    <div className="signature-box">
                        <p>SUPPLIER</p>
                        <div className="signature-space">( ........................................ )</div>
                    </div>
                    <div className="signature-box">
                        <p>PURCHASING DEPT.</p>
                        <div className="signature-space">( &nbsp;&nbsp;&nbsp;&nbsp;RANI&nbsp;&nbsp;&nbsp;&nbsp; )</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;