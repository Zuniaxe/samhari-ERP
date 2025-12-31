import { useState, useEffect } from "react";
import axios from "../api/axios";
import { 
    Search, Plus, Filter, Eye, RefreshCcw, Edit, Trash2, 
    ChevronLeft, ChevronRight, X, Upload, Info, Check, 
    Save, Calendar, Package
} from "lucide-react";

const Inventory = () => {
    // --- STATE UTAMA ---
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [activeTab, setActiveTab] = useState("RAW");

    // --- STATE UI ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // --- STATE FILTER ---
    const [selectedCategories, setSelectedCategories] = useState([]);

    // --- STATE LIST RAW MATERIALS (Untuk Dropdown di Sampling) ---
    const [rawMaterialList, setRawMaterialList] = useState([]);

    // --- FORM STATES ---
    // 1. Raw Material Form
    const [rawFormData, setRawFormData] = useState({
        name: "", category: "", unit: "", standard_cost: "", stock: ""
    });

    // 2. Finished Goods Form
    const [fgFormData, setFgFormData] = useState({
        name: "", color: "", size: "40", base_cost: "", selling_price: "", image: null
    });

    // 3. Sampling Form (Material Composer)
    const [sampleFormData, setSampleFormData] = useState({
        name: "", image: null, materials: [] 
    });
    // State sementara untuk dropdown pilih material di sampling
    const [selectedRawForSample, setSelectedRawForSample] = useState(""); 

    useEffect(() => {
        getItems();
    }, [page, keyword, activeTab]);

    // Fetch Data Table
    const getItems = async (overrideParams = {}) => {
        try {
            const cats = overrideParams.cats || selectedCategories;
            const response = await axios.get(`/inventory`, {
                params: {
                    search: keyword,
                    page: page,
                    limit: limit,
                    type: activeTab,
                    categories: cats.join(','),
                }
            });
            setItems(response.data.result);
            setTotalPages(response.data.totalPage);
        } catch (error) {
            console.error(error);
        }
    };

    // Helper: Load Raw Material List untuk Dropdown Sampling
    const loadRawMaterials = async () => {
        try {
            // Kita fetch RAW tipe tanpa limit untuk dropdown
            const response = await axios.get(`/inventory?type=RAW&limit=100`);
            setRawMaterialList(response.data.result);
        } catch (error) {
            console.error("Failed load raw mats", error);
        }
    };

    // --- HANDLERS UTAMA ---
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        getItems();
    };

    const openDrawer = () => {
        setIsDrawerOpen(true);
        // Jika buka tab sampling, load data bahan baku untuk dipilih
        if (activeTab === 'SAMPLING') {
            loadRawMaterials();
        }
    };

    const handleSave = async () => {
        try {
            let payload = {};
            
            if(activeTab === 'RAW') {
                payload = {
                    item_type: 'RAW',
                    name: rawFormData.name,
                    category: rawFormData.category,
                    unit: rawFormData.unit,
                    standard_cost_base: rawFormData.standard_cost,
                    stock: rawFormData.stock
                };
            } else if(activeTab === 'FINISHED') {
                payload = {
                    item_type: 'FINISHED',
                    name: fgFormData.name,
                    color: fgFormData.color,
                    size: fgFormData.size,
                    base_cost: fgFormData.base_cost,
                    selling_price: fgFormData.selling_price
                };
            } else if(activeTab === 'SAMPLING') {
                if(sampleFormData.materials.length === 0) return alert("Please add at least one material!");
                payload = {
                    item_type: 'SAMPLING',
                    name: sampleFormData.name,
                    materials: sampleFormData.materials
                };
            }

            await axios.post('/inventory', payload);
            setIsDrawerOpen(false);
            getItems();
            alert("Data saved successfully!");
            
            // Reset Forms
            setRawFormData({ name: "", category: "", unit: "", standard_cost: "", stock: "" });
            setFgFormData({ name: "", color: "", size: "40", base_cost: "", selling_price: "", image: null });
            setSampleFormData({ name: "", image: null, materials: [] });

        } catch (error) {
            console.error(error);
            alert("Failed to save data");
        }
    };

    // --- HANDLERS SAMPLING ---
    const addMaterialToSample = () => {
        if(!selectedRawForSample) return;
        const material = rawMaterialList.find(m => m.item_id == selectedRawForSample); // match by ID
        
        if(material) {
            // Cek duplikat
            if(sampleFormData.materials.find(m => m.id === material.item_id)) {
                return alert("Material already added!");
            }
            setSampleFormData(prev => ({
                ...prev,
                materials: [...prev.materials, { 
                    id: material.item_id, 
                    name: material.name, 
                    unit: material.unit,
                    standard_cost_base: material.std_cost_hpp_ref || 0, // Ambil dari view
                    qty: 1 
                }]
            }));
            setSelectedRawForSample(""); // Reset dropdown
        }
    };

    const updateSampleQty = (idx, val) => {
        const newMats = [...sampleFormData.materials];
        newMats[idx].qty = val;
        setSampleFormData({...sampleFormData, materials: newMats});
    };

    const removeSampleRow = (idx) => {
        const newMats = sampleFormData.materials.filter((_, i) => i !== idx);
        setSampleFormData({...sampleFormData, materials: newMats});
    };

    // Perhitungan Cost Sampling Realtime
    const totalSampleCost = sampleFormData.materials.reduce((acc, curr) => acc + (curr.qty * curr.standard_cost_base), 0);
    const estimatedHPP = totalSampleCost * 1.1; // Overhead 10%

    // --- HELPER FORMAT ---
    const formatRp = (num) => "Rp " + parseInt(num || 0).toLocaleString('id-ID');
    const getCategoryBadge = (category) => {
        const style = "px-3 py-1 rounded-full text-xs font-semibold border";
        switch (category) {
            case 'Leather': return `${style} bg-yellow-50 text-yellow-600 border-yellow-200`;
            case 'Glue': return `${style} bg-red-50 text-red-500 border-red-100`;
            default: return `${style} bg-blue-50 text-blue-600 border-blue-100`;
        }
    };

    return (
        <div className="w-full relative min-h-screen p-6 bg-gray-50/50">
            
            {/* HEADER */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage raw materials, finished goods, and sampling</p>
            </div>

            {/* TABS */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    {[{ id: 'RAW', label: 'Raw Materials' }, { id: 'FINISHED', label: 'Finished Goods' }, { id: 'SAMPLING', label: 'Sampling / R&D' }].map((tab) => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1); }}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* TOOLBAR */}
            <div className="flex justify-between items-center mb-6">
                <form onSubmit={handleSearch} className="relative w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
                        placeholder={`Search ${activeTab.toLowerCase().replace('_',' ')}...`} 
                        value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </form>
                
                <div className="flex gap-3 ml-4">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                        <Filter size={16} /> Filter
                    </button>
                    <button onClick={openDrawer} className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] text-white rounded-lg text-sm font-medium hover:bg-[#1e293b] shadow-sm transition">
                        <Plus size={16} /> Add {activeTab === 'SAMPLING' ? 'Sample' : activeTab === 'FINISHED' ? 'Product' : 'Material'}
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="py-4 pl-6 text-xs font-bold text-gray-800 uppercase w-16">Image</th>
                            
                            {/* DYNAMIC HEADER BASED ON TAB */}
                            {activeTab === 'RAW' && (
                                <>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Material Name</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Category</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Stock</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Unit</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Std Cost</th>
                                </>
                            )}
                            {activeTab === 'FINISHED' && (
                                <>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Product Name</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Model</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Variant</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Stock</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Price</th>
                                </>
                            )}
                            {activeTab === 'SAMPLING' && (
                                <>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Sample Name</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Mat. Cost</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Est. HPP</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Status</th>
                                    <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase">Created</th>
                                </>
                            )}
                            <th className="py-4 px-4 text-xs font-bold text-gray-800 uppercase text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-10 text-gray-500">No items found</td></tr>
                        ) : items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition group">
                                <td className="py-4 pl-6">
                                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                        <Package size={20} className="text-gray-400"/>
                                    </div>
                                </td>

                                {/* DYNAMIC BODY BASED ON TAB */}
                                {activeTab === 'RAW' && (
                                    <>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-[11px] text-gray-400">{item.sku}</p>
                                        </td>
                                        <td className="py-4 px-4"><span className={getCategoryBadge(item.category)}>{item.category}</span></td>
                                        <td className="py-4 px-4 font-bold">{item.current_stock}</td>
                                        <td className="py-4 px-4 text-sm text-gray-500">{item.unit}</td>
                                        <td className="py-4 px-4 font-mono text-sm">{formatRp(item.std_cost_hpp_ref)}</td>
                                    </>
                                )}

                                {activeTab === 'FINISHED' && (
                                    <>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
                                            <p className="text-[11px] text-gray-400">{item.sku}</p>
                                        </td>
                                        <td className="py-4 px-4 text-sm">{item.model_name}</td>
                                        <td className="py-4 px-4 text-sm">
                                            {item.color} <span className="bg-gray-100 px-1 rounded text-xs ml-1">{item.size}</span>
                                        </td>
                                        <td className="py-4 px-4 font-bold">{item.stock_qty}</td>
                                        <td className="py-4 px-4 font-mono text-sm font-bold text-green-700">{formatRp(item.selling_price)}</td>
                                    </>
                                )}

                                {activeTab === 'SAMPLING' && (
                                    <>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-[11px] text-gray-400">{item.sample_code}</p>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-sm">{formatRp(item.total_material_cost)}</td>
                                        <td className="py-4 px-4 font-mono text-sm font-bold text-gray-700">{formatRp(item.estimated_hpp)}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                    </>
                                )}

                                <td className="py-4 px-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-3">
                                        <button className="text-gray-400 hover:text-gray-600"><Eye size={16}/></button>
                                        <button className="text-blue-400 hover:text-blue-600"><Edit size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination (Simple) */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                     <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16}/></button>
                     <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                     <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>
            </div>

            {/* --- SIDE DRAWER --- */}
            {isDrawerOpen && (
                <>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
                        
                        {/* Drawer Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {activeTab === 'RAW' ? 'New Raw Material' : activeTab === 'FINISHED' ? 'New Product' : 'Create Sample'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Fill in the details below</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* --- FORM RAW MATERIAL --- */}
                            {activeTab === 'RAW' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Material Name</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            value={rawFormData.name} onChange={e => setRawFormData({...rawFormData, name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600">Category</label>
                                            <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white"
                                                value={rawFormData.category} onChange={e => setRawFormData({...rawFormData, category: e.target.value})}>
                                                <option value="">Select...</option>
                                                <option value="Leather">Leather</option>
                                                <option value="Rubber">Rubber</option>
                                                <option value="Glue">Glue</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600">Unit</label>
                                            <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white"
                                                value={rawFormData.unit} onChange={e => setRawFormData({...rawFormData, unit: e.target.value})}>
                                                <option value="">Select...</option>
                                                <option value="meter">Meter</option>
                                                <option value="kg">Kg</option>
                                                <option value="sqft">Sq. Ft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Standard Cost (Rp)</label>
                                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            value={rawFormData.standard_cost} onChange={e => setRawFormData({...rawFormData, standard_cost: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Initial Stock</label>
                                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            value={rawFormData.stock} onChange={e => setRawFormData({...rawFormData, stock: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {/* --- FORM FINISHED GOODS --- */}
                            {activeTab === 'FINISHED' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Product Name</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            value={fgFormData.name} onChange={e => setFgFormData({...fgFormData, name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600">Color</label>
                                            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                                value={fgFormData.color} onChange={e => setFgFormData({...fgFormData, color: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600">Size</label>
                                            <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white"
                                                value={fgFormData.size} onChange={e => setFgFormData({...fgFormData, size: e.target.value})}>
                                                <option>38</option><option>39</option><option>40</option><option>41</option><option>42</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Base Cost / HPP (Rp)</label>
                                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            value={fgFormData.base_cost} onChange={e => setFgFormData({...fgFormData, base_cost: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Selling Price (Rp)</label>
                                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 font-bold text-green-700" 
                                            value={fgFormData.selling_price} onChange={e => setFgFormData({...fgFormData, selling_price: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {/* --- FORM SAMPLING (Material Composer) --- */}
                            {activeTab === 'SAMPLING' && (
                                <div className="space-y-4 h-full flex flex-col">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Sample Name</label>
                                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                                            placeholder="e.g. Prototype Gunung V1"
                                            value={sampleFormData.name} onChange={e => setSampleFormData({...sampleFormData, name: e.target.value})} />
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-gray-800">Composition (BOM)</h3>
                                        </div>
                                        
                                        {/* Material Selector */}
                                        <div className="flex gap-2 mb-3">
                                            <select className="flex-1 border rounded px-2 py-1.5 text-xs bg-white"
                                                value={selectedRawForSample} onChange={e => setSelectedRawForSample(e.target.value)}>
                                                <option value="">-- Select Material --</option>
                                                {rawMaterialList.map(m => (
                                                    <option key={m.item_id} value={m.item_id}>{m.name} ({m.unit}) - {formatRp(m.std_cost_hpp_ref)}</option>
                                                ))}
                                            </select>
                                            <button onClick={addMaterialToSample} className="bg-gray-800 text-white px-3 rounded text-xs">Add</button>
                                        </div>

                                        {/* Material List */}
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 flex-1 overflow-y-auto p-2 space-y-2">
                                            {sampleFormData.materials.map((mat, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded shadow-sm flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-gray-800">{mat.name}</p>
                                                        <p className="text-[10px] text-gray-500">Cost: {formatRp(mat.standard_cost_base)} / {mat.unit}</p>
                                                    </div>
                                                    <input type="number" className="w-16 border rounded px-1 py-1 text-xs text-center" 
                                                        value={mat.qty} onChange={(e) => updateSampleQty(idx, e.target.value)} />
                                                    <div className="w-20 text-right text-xs font-semibold">
                                                        {formatRp(mat.qty * mat.standard_cost_base)}
                                                    </div>
                                                    <button onClick={() => removeSampleRow(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                            {sampleFormData.materials.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No materials added.</p>}
                                        </div>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="bg-gray-900 text-white p-4 rounded-lg mt-auto">
                                        <div className="flex justify-between text-xs mb-1 opacity-80">
                                            <span>Total Material Cost</span>
                                            <span>{formatRp(totalSampleCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-2 mt-2">
                                            <span>Est. HPP (+10%)</span>
                                            <span>{formatRp(estimatedHPP)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                            <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-[#0f172a] text-white rounded-lg text-sm font-medium hover:bg-[#1e293b] flex items-center gap-2">
                                <Save size={16}/> Save Data
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Inventory;