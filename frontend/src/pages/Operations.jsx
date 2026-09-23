import { useState, useEffect } from "react";
import axios from "../api/axios";
import { Search, ArrowDownToLine, ArrowUpFromLine, ScanBarcode, X } from "lucide-react";

const Operations = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = storedUser?.role?.toLowerCase() || 'user';

    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("ALL");
    const [search, setSearch] = useState("");

    // State untuk Modal Transaksi
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("IN");
    const [itemsList, setItemsList] = useState([]);
    const [formData, setFormData] = useState({ item_id: '', qty: '', reference_number: '', notes: '' });
    
    // FUNGSI FORMAT RUPIAH
    const formatRp = (n) => "Rp " + parseInt(n || 0).toLocaleString('id-ID');

    useEffect(() => {
        fetchHistory();
        if (role === 'admin') fetchItemsList(); // Hanya ambil data barang jika Admin
    }, [role]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get("/operations");
            if (Array.isArray(response.data)) setHistory(response.data);
            else setHistory([]);
        } catch (error) { setHistory([]); }
    };

    const fetchItemsList = async () => {
        try {
            // Mengambil barang RAW dan FINISHED untuk Modal Transaksi Manual
            const resRaw = await axios.get("/inventory?type=RAW&limit=1000"); 
            const resFin = await axios.get("/inventory?type=FINISHED&limit=1000"); 
            const rawItems = resRaw.data?.result || [];
            const finItems = resFin.data?.result || [];
            setItemsList([...rawItems, ...finItems]);
        } catch (error) { console.error("Gagal mengambil list barang"); }
    };

    const openModal = (type) => {
        setModalType(type);
        setFormData({ item_id: '', qty: '', reference_number: '', notes: '' });
        setIsModalOpen(true);
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/operations", { ...formData, movement_type: modalType });
            alert(`Transaksi ${modalType === 'IN' ? 'Inbound' : 'Outbound'} berhasil dicatat!`);
            setIsModalOpen(false);
            fetchHistory(); // Refresh riwayat tabel di layar
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.msg || "Gagal mencatat transaksi.");
        }
    };

    const safeHistory = Array.isArray(history) ? history : [];
    const filteredHistory = safeHistory.filter(item => {
        const matchTab = activeTab === "ALL" || item.movement_type === activeTab;
        const matchSearch = (item.item_name || "").toLowerCase().includes(search.toLowerCase()) || 
                            (item.reference_number || "").toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    return (
        <div className="w-full min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">Operations</h1>
                        <p className="text-sm text-gray-500">Record inbound (receiving) and outbound (issuing) transactions.</p>
                    </div>
                    
                    {role === 'admin' && (
                        <div className="flex gap-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                                <ScanBarcode size={16}/> Scan
                            </button>
                            <button onClick={() => openModal('IN')} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-100 flex items-center gap-2 transition">
                                <ArrowDownToLine size={16}/> Inbound
                            </button>
                            <button onClick={() => openModal('OUT')} className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 flex items-center gap-2 transition">
                                <ArrowUpFromLine size={16}/> Outbound
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['ALL', 'IN', 'OUT'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {tab === 'ALL' ? 'All History' : tab === 'IN' ? 'Inbound' : 'Outbound'}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="Search ref number or item..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 bg-gray-50/30">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-24">Type</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date & Ref</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Item Details</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Quantity & Value</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 text-sm">No transaction history found.</td></tr>
                            ) : filteredHistory.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/80 transition">
                                    <td className="py-4 pl-6">
                                        {item.movement_type === 'IN' ? (
                                            <span className="flex items-center justify-center gap-1 w-16 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold"><ArrowDownToLine size={12}/> IN</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1 w-16 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-bold"><ArrowUpFromLine size={12}/> OUT</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-bold text-sm text-gray-900">{item.reference_number || 'AUTO-SYS'}</p>
                                        <p className="text-[11px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                                            {new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-bold text-sm text-gray-900">{item.item_name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>
                                    </td>
                                    
                                    {/* --- PERUBAHAN KOLOM QUANTITY & HARGA DI SINI --- */}
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <div>
                                                <span className={`font-bold text-sm ${item.movement_type === 'IN' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {item.movement_type === 'IN' ? '+' : '-'}{item.qty}
                                                </span>
                                                <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-mono mt-1">
                                                {formatRp(item.standard_cost_base)} / {item.unit}
                                            </p>
                                            <p className={`text-xs font-bold font-mono mt-0.5 ${item.movement_type === 'IN' ? 'text-green-700' : 'text-orange-700'}`}>
                                                = {formatRp(item.qty * (item.standard_cost_base || 0))}
                                            </p>
                                        </div>
                                    </td>
                                    {/* ------------------------------------------------ */}

                                    <td className="py-4 px-4">
                                        <p className="text-xs text-gray-600">{item.notes}</p>
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">By: {item.operator_name || 'System'}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM INBOUND / OUTBOUND --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-[500px] relative z-10 shadow-2xl overflow-hidden">
                        <div className={`p-6 border-b flex justify-between items-center text-white ${modalType === 'IN' ? 'bg-green-600' : 'bg-orange-600'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {modalType === 'IN' ? <ArrowDownToLine size={20}/> : <ArrowUpFromLine size={20}/>}
                                Record Manual {modalType === 'IN' ? 'Inbound' : 'Outbound'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Select Item *</label>
                                <select required className="w-full border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50" value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})}>
                                    <option value="" disabled>-- Pilih Barang --</option>
                                    {itemsList.map(item => (
                                        <option key={item.id} value={item.id}>{item.sku} - {item.name} (Stock: {item.stock})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Quantity *</label>
                                    <input type="number" required min="1" className="w-full border-gray-300 rounded-lg p-2.5 text-sm" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reference (PO/INV)</label>
                                    <input type="text" placeholder="Opsional" className="w-full border-gray-300 rounded-lg p-2.5 text-sm" value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notes / Alasan</label>
                                <textarea rows="2" className="w-full border-gray-300 rounded-lg p-2.5 text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className={`px-5 py-2 text-white rounded-lg text-sm font-bold shadow-lg ${modalType === 'IN' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}`}>
                                    Save Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;