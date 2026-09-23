import { useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import { 
    Search, Plus, Filter, Eye, Edit, Trash2, 
    X, Upload, ImageIcon, ChevronDown, Save, MoreHorizontal,
    LayoutGrid, List, AlertCircle, Printer, CheckCircle
} from "lucide-react";
import BarcodeLabel from "../components/BarcodeLabel";

const Inventory = () => {
    // --- MENGAMBIL ROLE DARI LOCAL STORAGE ---
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = storedUser?.role?.toLowerCase() || 'user';

    // --- STATE UTAMA ---
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState("RAW");

    // --- FILTER STATE ---
    const [keyword, setKeyword] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        categories: [], 
        stockStatus: "ALL", 
    });

    // --- DRAWER & FORM STATE ---
    const [drawerMode, setDrawerMode] = useState(null); 
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    // --- DATA REFERENCES ---
    const [rawMaterialList, setRawMaterialList] = useState([]); 

    // --- UNIFIED FORM DATA ---
    const initialForm = { 
        name: "", stock: "", image: null, preview: null, sku: "", 
        category: "", unit: "", standard_cost: "", 
        model: "", color: "", size: "40", base_cost: "", selling_price: "", 
        materials: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [selectedRawForSample, setSelectedRawForSample] = useState(""); 
    const fileInputRef = useRef(null); 

    // --- STATE & DATA UNTUK POPUP EXCEL ---
    const [popupState, setPopupState] = useState({ isOpen: false, field: "", tempValue: "" });
    
    const listBahanDariExcel = [
        "Spons Eva 3mm Black", "Premium Leather Brown", "Industrial Adhesive Glue",
        "Cotton Fabric Strap Beige", "EVA Rubber Sheet 5mm", "Synthetic Leather Tan",
        "Contact Cement Premium", "Polyester Webbing Black",
        "SPONGE PYLON RUBBER 13 MM BLACK", "SPONGE HAK 6 MM POLOS BLUE", 
        "WEBING KALIBRE 01 25 MM", "OUTSOLE KALIBRE", "SELETING", "L. STICKER SANDAL"
    ];
    const listKategoriDariExcel = ["Leather", "Rubber", "Glue", "Fabric", "Sponge"];

    // --- EFFECTS ---
    useEffect(() => {
        fetchItems();
    }, [page, keyword, activeTab, filters]);

    // --- API CALLS ---
    const fetchItems = async () => {
        try {
            const params = { 
                search: keyword, page, limit: 10, type: activeTab,
                categories: filters.categories.join(','),
            };
            const response = await axios.get(`/inventory`, { params });
            
            // MENGURUTKAN DATA: Semua jenis PENDING selalu di atas
            const sortedData = response.data.result.sort((a, b) => {
                const aPending = a.approval_status.includes('PENDING');
                const bPending = b.approval_status.includes('PENDING');
                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;
                return 0;
            });
            
            setItems(sortedData);
        } catch (error) { console.error(error); }
    };

    const loadRawMaterials = async () => {
        try {
            const response = await axios.get(`/inventory?type=RAW&limit=100`);
            setRawMaterialList(response.data.result);
        } catch (error) { console.error(error); }
    };

    // --- HANDLERS ---
    const handleSelectChange = (e, field) => {
        const value = e.target.value;
        if (value === "OTHER") {
            setPopupState({ isOpen: true, field: field, tempValue: "" });
            setFormData({ ...formData, [field]: "" });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const handleSavePopup = () => {
        if (!popupState.tempValue.trim()) return alert("Input tidak boleh kosong!");
        setFormData({ ...formData, [popupState.field]: popupState.tempValue });
        setPopupState({ isOpen: false, field: "", tempValue: "" });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, image: file, preview: URL.createObjectURL(file) });
    };

    const openDrawer = async (mode, item = null) => {
        setDrawerMode(mode);
        setSelectedItem(item);
        
        if (mode === 'ADD') {
            setFormData(initialForm);
            if (activeTab === 'SAMPLING') loadRawMaterials();
        } else if (item) {
            let data = { ...initialForm, preview: item.image_path ? `http://localhost:5000/uploads/${item.image_path}` : null };
            
            if (activeTab === 'RAW') {
                data = { ...data, 
                    sku: item.sku, name: item.name, category: item.category, unit: item.unit, 
                    standard_cost: item.standard_cost_base, stock: item.stock 
                };
            } else if (activeTab === 'FINISHED') {
                data = { ...data, 
                    sku: item.sku, name: item.name, model: item.model_name || item.variant, 
                    color: item.color, size: item.size, 
                    base_cost: item.standard_cost_base, selling_price: item.last_purchase_price, stock: item.stock 
                };
            } else if (activeTab === 'SAMPLING') {
                loadRawMaterials();
                try {
                    const res = await axios.get(`/inventory`, { params: { type: 'SAMPLING_DETAIL', id: item.id } });
                    const mats = res.data.map(m => ({ id: m.raw_item_id, name: m.material_name, unit: m.unit, standard_cost_base: m.standard_cost_base, qty: parseFloat(m.qty_base) }));
                    data = { ...data, sku: item.sku, name: item.name, materials: mats };
                } catch (e) { console.error(e); }
            }
            setFormData(data);
        }
    };

    const handleSave = async () => {
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("item_type", activeTab);

            if (activeTab === 'RAW') {
                data.append("category", formData.category);
                data.append("unit", formData.unit);
                data.append("standard_cost_base", formData.standard_cost);
                data.append("stock", formData.stock);
            } else if (activeTab === 'FINISHED') {
                data.append("model", formData.model);
                data.append("color", formData.color);
                data.append("size", formData.size);
                data.append("base_cost", formData.base_cost);
                data.append("selling_price", formData.selling_price);
                data.append("stock", formData.stock);
            } else if (activeTab === 'SAMPLING') {
                data.append("materials", JSON.stringify(formData.materials));
            }

            if (formData.image) data.append("image", formData.image);
            const config = { headers: { "Content-Type": "multipart/form-data" } };

            if (drawerMode === 'ADD') await axios.post('/inventory', data, config);
            else if (drawerMode === 'EDIT') {
                const id = selectedItem.id;
                await axios.put(`/inventory/${id}`, data, config);
            }
            setDrawerMode(null);
            fetchItems();
            alert("Success!");
        } catch (error) { console.error(error); alert("Failed to save"); }
    };

    const handleDelete = async () => {
        try {
            const id = selectedItem?.id || itemToDelete?.id;
            await axios.delete(`/inventory/${id}`, { params: { type: activeTab } });
            setIsDeleteModalOpen(false);
            fetchItems();
            alert("Berhasil dihapus!");
        } catch (error) { console.error(error); alert("Failed delete"); }
    };

    // --- FUNGSI APPROVE BARU UNTUK ADMIN ---
    const handleApprove = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin meng-approve pengajuan ini?")) return;
        try {
            await axios.put(`/inventory/approve/${id}`, { action: "APPROVED" });
            fetchItems();
            alert("Pengajuan berhasil disetujui!");
        } catch (error) {
            console.error(error);
            alert("Gagal melakukan persetujuan.");
        }
    };

    const addMat = () => {
        const mat = rawMaterialList.find(m => m.id == selectedRawForSample);
        if(mat && !formData.materials.find(m => m.id === mat.id)) {
            setFormData(p => ({ ...p, materials: [...p.materials, { id: mat.id, name: mat.name, unit: mat.unit, standard_cost_base: mat.standard_cost_base, qty: 1 }] }));
        }
    };

    const formatRp = (n) => "Rp " + parseInt(n || 0).toLocaleString('id-ID');

    // --- FORM CONTENT RENDER ---
    const renderFormContent = () => {
        const disabled = drawerMode === 'VIEW';
        
        if (activeTab === 'RAW') return (
            <div className="space-y-8">
                <div className="flex gap-6 items-start">
                    <div 
                        onClick={() => !disabled && fileInputRef.current.click()}
                        className={`w-32 h-32 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition cursor-pointer overflow-hidden relative ${disabled ? 'cursor-default' : ''}`}
                    >
                        {formData.preview ? (
                            <img src={formData.preview} className="w-full h-full object-cover" />
                        ) : (
                            <><ImageIcon className="text-gray-400 mb-2" size={24}/><span className="text-[10px] text-gray-500 font-medium">Upload Image</span></>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" disabled={disabled}/>
                    </div>
                    <div className="flex-1">
                        {drawerMode !== 'ADD' && (
                            <div className="mb-2 flex items-center gap-3">
                                <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">{formData.sku}</span>
                                {disabled && <BarcodeLabel sku={formData.sku} />}
                            </div>
                        )}
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Material Name</label>
                        <select 
                            className="w-full border-gray-300 border-b-2 focus:border-black focus:outline-none py-2 text-lg font-semibold bg-transparent"
                            disabled={disabled} 
                            value={formData.name || ""} 
                            onChange={e => handleSelectChange(e, 'name')}
                        >
                            <option value="" disabled>-- Pilih Bahan Baku --</option>
                            {listBahanDariExcel.map(b => <option key={b} value={b}>{b}</option>)}
                            {formData.name && !listBahanDariExcel.includes(formData.name) && (
                                <option value={formData.name}>{formData.name} (Custom)</option>
                            )}
                            <option value="OTHER" className="font-bold text-blue-600 bg-blue-50">➕ Lainnya (Input Manual)...</option>
                        </select>
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Specifications</h5>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Category</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                                disabled={disabled} value={formData.category || ""} onChange={e => handleSelectChange(e, 'category')}>
                                <option value="" disabled>Select Category</option>
                                {listKategoriDariExcel.map(c => <option key={c} value={c}>{c}</option>)}
                                {formData.category && !listKategoriDariExcel.includes(formData.category) && (
                                    <option value={formData.category}>{formData.category} (Custom)</option>
                                )}
                                <option value="OTHER" className="font-bold text-blue-600 bg-blue-50">➕ Lainnya (Input Manual)...</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Unit of Measure</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                                disabled={disabled} value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})}>
                                <option value="">Select Unit</option><option>cm</option><option>m</option><option>kg</option><option>pcs</option><option>pairs</option><option>set</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><LayoutGrid size={14}/> Inventory & Costing</h5>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Standard Cost (HPP)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                                <input type="number" className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 text-sm font-mono"
                                    disabled={disabled} value={formData.standard_cost} onChange={e=>setFormData({...formData, standard_cost: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Current Stock</label>
                            <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-blue-600"
                                disabled={disabled} value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
        );

        if (activeTab === 'FINISHED') return (
            <div className="space-y-8">
                <div className="flex gap-6">
                    <div 
                        onClick={() => !disabled && fileInputRef.current.click()}
                        className={`w-40 h-40 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition cursor-pointer overflow-hidden relative`}
                    >
                         {formData.preview ? <img src={formData.preview} className="w-full h-full object-cover" /> : <Upload className="text-gray-400"/>}
                         <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" disabled={disabled}/>
                    </div>
                    <div className="flex-1 space-y-4">
                        {drawerMode !== 'ADD' && (
                            <div className="mb-1 flex items-center gap-4">
                                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{formData.sku}</span>
                                {disabled && <BarcodeLabel sku={formData.sku} />}
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                            <input className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-black" 
                                placeholder="e.g. Gladiator Sandal V2"
                                disabled={disabled} value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Model / Variant</label>
                            <input className="w-full border-gray-300 rounded-lg p-2.5 text-sm" 
                                placeholder="e.g. Black - Size 40"
                                disabled={disabled} value={formData.model} onChange={e=>setFormData({...formData, model: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Base Cost (HPP)</label>
                        <input type="number" className="w-full bg-white border-gray-200 rounded-lg p-2 text-sm font-mono text-gray-700"
                            disabled={disabled} value={formData.base_cost} onChange={e=>setFormData({...formData, base_cost: e.target.value})} />
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                        <label className="text-xs font-bold text-green-700 uppercase mb-1 block">Selling Price</label>
                        <input type="number" className="w-full bg-white border-green-200 rounded-lg p-2 text-sm font-mono text-green-700 font-bold"
                            disabled={disabled} value={formData.selling_price} onChange={e=>setFormData({...formData, selling_price: e.target.value})} />
                    </div>
                </div>

                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Stock On Hand</label>
                     <input type="number" className="w-full border-gray-300 rounded-lg p-3 text-lg font-bold"
                            disabled={disabled} value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} />
                </div>
            </div>
        );

        if (activeTab === 'SAMPLING') return (
            <div className="space-y-6 h-full flex flex-col">
                <div>
                    {drawerMode !== 'ADD' && (
                        <div className="mb-2 flex items-center gap-4">
                            <span className="text-[10px] font-mono bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100">{formData.sku}</span>
                            {disabled && <BarcodeLabel sku={formData.sku} />}
                        </div>
                    )}
                    <label className="text-xs font-bold text-gray-500 uppercase">Sample / Prototype Name</label>
                    <input className="w-full border-gray-300 border-b-2 focus:border-black py-2 text-xl font-bold bg-transparent" 
                        placeholder="e.g. Project Alpha 2025"
                        disabled={disabled} value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="flex-1 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-3 bg-white border-b flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase text-gray-600">Bill of Materials (BOM)</h4>
                        <div className="text-xs text-gray-400">{formData.materials.length} Items</div>
                    </div>
                    
                    {!disabled && (
                        <div className="p-3 border-b bg-gray-50 flex gap-2">
                            <select className="flex-1 border-gray-300 rounded-lg text-sm" 
                                value={selectedRawForSample} onChange={e=>setSelectedRawForSample(e.target.value)}>
                                <option value="">+ Add Material from Inventory</option>
                                {rawMaterialList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <button onClick={addMat} className="bg-black text-white px-4 rounded-lg text-xs font-bold hover:bg-gray-800">Add</button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {formData.materials.map((mat, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500">{idx+1}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{mat.name}</p>
                                    <p className="text-[10px] text-gray-400">{formatRp(mat.standard_cost_base)} / {mat.unit}</p>
                                </div>
                                <div className="flex items-center border rounded-md overflow-hidden">
                                    <input type="number" className="w-12 text-center text-xs p-1 border-r" value={mat.qty} disabled={disabled}
                                        onChange={e => {
                                            const newMats = [...formData.materials];
                                            newMats[idx].qty = e.target.value;
                                            setFormData({...formData, materials: newMats});
                                        }} />
                                    <span className="bg-gray-50 px-2 text-[10px] text-gray-500 py-1">{mat.unit}</span>
                                </div>
                                <div className="w-20 text-right font-mono text-xs font-semibold">{formatRp(mat.qty * mat.standard_cost_base)}</div>
                                {!disabled && <button onClick={()=>{
                                    setFormData({...formData, materials: formData.materials.filter((_,i)=>i!==idx)})
                                }} className="text-red-400 hover:text-red-600"><X size={14}/></button>}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-400">Total Estimated Cost</span>
                        <span className="text-lg font-bold font-mono">
                            {formatRp(formData.materials.reduce((acc, curr)=> acc + (curr.qty * curr.standard_cost_base), 0))}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen bg-white font-sans text-gray-900 flex flex-col">
            
            {/* --- HEADER --- */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">Inventory Management</h1>
                        <p className="text-sm text-gray-500">Track raw materials, finished goods, and product recipes.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* CONDITIONAL RENDERING: ADD BUTTON HANYA UNTUK OPERATOR */}
                        {role === 'operator' && (
                            <button onClick={() => openDrawer('ADD')} className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-gray-200">
                                <Plus size={16}/> Add {activeTab === 'RAW' ? 'Material' : activeTab === 'FINISHED' ? 'Product' : 'Sample'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {[{id:'RAW', l:'Raw Materials'}, {id:'FINISHED', l:'Finished Goods'}, {id:'SAMPLING', l:'Sampling'}].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.l}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto relative">
                        {/* Search Bar... */}
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition" 
                                placeholder="Search inventory..." 
                                value={keyword} 
                                onChange={e => setKeyword(e.target.value)} 
                            />
                        </div>
                        
                        {/* Filter Button... */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                                className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition ${isFilterOpen || filters.categories.length > 0 ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Filter size={16} /> Filter
                            </button>
                            
                            {isFilterOpen && (
                                <div className="absolute top-12 right-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-5 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-gray-900">Filter Options</h4>
                                        <button onClick={() => setFilters({categories:[], stockStatus: "ALL"})} className="text-xs text-blue-600 hover:underline">Reset</button>
                                    </div>
                                    
                                    {activeTab === 'RAW' && (
                                        <div className="mb-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Category</label>
                                            <div className="space-y-2">
                                                {listKategoriDariExcel.map(cat => (
                                                    <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                        <input type="checkbox" 
                                                            checked={filters.categories.includes(cat)}
                                                            onChange={(e) => {
                                                                if(e.target.checked) setFilters({...filters, categories: [...filters.categories, cat]});
                                                                else setFilters({...filters, categories: filters.categories.filter(c => c !== cat)});
                                                            }}
                                                            className="rounded border-gray-300 text-black focus:ring-black"/>
                                                        {cat}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Stock Status</label>
                                        <select className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            value={filters.stockStatus} onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}>
                                            <option value="ALL">All Items</option>
                                            <option value="LOW">Low Stock ({'<'} 10)</option>
                                            <option value="OUT">Out of Stock (0)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="flex-1 p-8 bg-gray-50/30">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-16">Image</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {activeTab === 'RAW' ? 'Material Name' : activeTab === 'FINISHED' ? 'Product Name' : 'Sample Name'}
                                </th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Barcode Label</th>
                                
                                {/* PASTIKAN HEADER CATEGORY ADA DI SINI */}
                                {activeTab === 'RAW' && <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>}
                                
                                {/* TAMBAHKAN HEADER DATE AGAR TANGGALNYA PUNYA RUMAH SENDIRI */}
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date Added</th>

                                {activeTab !== 'SAMPLING' && <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>}
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {activeTab === 'SAMPLING' ? 'Est. Cost' : 'Valuation'}
                                </th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-4 text-right pr-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
 <tbody className="divide-y divide-gray-50">
    {items.length === 0 ? (
        <tr><td colSpan="9" className="text-center py-12 text-gray-400 text-sm">No items found.</td></tr>
    ) : items.map((item, idx) => (
        <tr key={idx} className={`transition group ${item.approval_status.includes('PENDING') ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50/80'}`}>
            <td className="py-3 pl-6">
                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                    {item.image_path ? <img src={`http://localhost:5000/uploads/${item.image_path}`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14}/></div>}
                </div>
            </td>
            
            <td className="py-3 px-4">
                <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>
            </td>
            
            <td className="py-3 px-4"><BarcodeLabel sku={item.sku} /></td>
            
            {/* 1. KOLOM CATEGORY (Hanya muncul jika tab RAW) */}
            {activeTab === 'RAW' && (
                <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold text-gray-600 uppercase">{item.category}</span>
                </td>
            )}

            {/* 2. KOLOM DATE */}
            <td className="py-3 px-4 font-mono text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
            
            {/* 3. KOLOM STOCK */}
            {activeTab !== 'SAMPLING' && (
                <td className="py-3 px-4">
                    <span className={`font-bold text-sm ${(item.stock) < 10 ? 'text-red-500' : 'text-green-600'}`}>{item.stock}</span>
                    <span className="text-xs text-gray-400 ml-1">{activeTab === 'FINISHED' ? 'pairs' : item.unit}</span>
                </td>
            )}
            
            <td className="py-3 px-4 font-mono text-xs font-medium text-gray-600">{formatRp(item.standard_cost_base)}</td>

            <td className="py-3 px-4">
                {item.approval_status.includes('PENDING') ? (
                    <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                            item.approval_status === 'PENDING_DELETE' ? 'bg-red-100 text-red-700' :
                            item.approval_status === 'PENDING_UPDATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {item.approval_status.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold">Waiting for Admin</span>
                    </div>
                ) : item.approval_status === 'APPROVED' ? (
                    <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-[10px] font-bold tracking-wider">APPROVED</span>
                ) : null}
            </td>
            
            <td className="py-3 px-4 text-right pr-6">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openDrawer('VIEW', item)} className="p-2 hover:bg-gray-200 rounded-md text-gray-500"><Eye size={14}/></button>
                    
                    {role === 'operator' && item.approval_status !== 'PENDING_DELETE' && (
                        <>
                            <button onClick={() => openDrawer('EDIT', item)} className="p-2 hover:bg-blue-50 rounded-md text-blue-600"><Edit size={14}/></button>
                            <button onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 rounded-md text-red-600"><Trash2 size={14}/></button>
                        </>
                    )}

                    {role === 'admin' && item.approval_status.includes('PENDING') && (
                        <button onClick={() => handleApprove(item.id)} className="p-2 hover:bg-green-100 rounded-md text-green-700" title="Approve Request"><CheckCircle size={14} strokeWidth={2.5}/></button>
                    )}
                </div>
            </td>
        </tr>
    ))}
</tbody>
                    </table>
                </div>
            </div>

            {/* --- RIGHT DRAWER --- */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${drawerMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setDrawerMode(null)} />
                <div className={`absolute inset-y-0 right-0 w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${drawerMode ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-start">
                        <div>
                            <span className="px-2 py-1 rounded bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2 inline-block">
                                {activeTab === 'RAW' ? 'Raw Material' : activeTab === 'FINISHED' ? 'Finished Good' : 'Prototype'}
                            </span>
                            <h2 className="text-xl font-bold text-gray-900">
                                {drawerMode === 'ADD' ? 'Create New Record' : drawerMode === 'EDIT' ? 'Edit Record' : 'Record Details'}
                            </h2>
                        </div>
                        <button onClick={() => setDrawerMode(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 relative">
                        {renderFormContent()}

                        {/* --- KODE POPUP MODAL --- */}
                        {popupState.isOpen && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-xl" onClick={() => setPopupState({isOpen: false, field: "", tempValue: ""})}></div>
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6 transform transition-all border border-gray-100">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <Plus size={18} className="text-blue-500" />
                                            Input {popupState.field === 'name' ? 'Bahan Baku' : 'Kategori'} Baru
                                        </h3>
                                    </div>
                                    <input 
                                        type="text" autoFocus
                                        placeholder={`Ketik ${popupState.field === 'name' ? 'nama bahan' : 'kategori'}...`}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6 bg-gray-50"
                                        value={popupState.tempValue}
                                        onChange={(e) => setPopupState({ ...popupState, tempValue: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSavePopup()}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setPopupState({isOpen: false, field: "", tempValue: ""})} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
                                        <button onClick={handleSavePopup} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition">Gunakan Input</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ----------------------- */}

                    </div>

                    {drawerMode !== 'VIEW' && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setDrawerMode(null)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-white transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center gap-2">
                                <Save size={16}/> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- DELETE MODAL --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl p-8 w-[400px] relative z-10 text-center shadow-2xl transform transition-all scale-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32}/>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">Delete this item?</h3>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Are you sure you want to remove <span className="font-bold text-gray-800">"{itemToDelete?.name}"</span>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-100">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;