import { useState, useEffect } from "react";
import axios from "../api/axios";
import { 
    Search, Plus, User, Truck, Mail, Phone, MapPin, 
    Edit, Trash2, X, Save, Briefcase, Building
} from "lucide-react";

const People = () => {
    const [data, setData] = useState([]);
    const [activeTab, setActiveTab] = useState("EMPLOYEE"); // EMPLOYEE | SUPPLIER
    const [keyword, setKeyword] = useState("");
    
    // Drawer & Form State
    const [drawerMode, setDrawerMode] = useState(null); // ADD | EDIT
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, [activeTab, keyword]);

    const fetchData = async () => {
        try {
            const res = await axios.get('/people', {
                params: { type: activeTab, search: keyword }
            });
            setData(res.data.result);
        } catch (error) { console.error(error); }
    };

    const openDrawer = (mode, item = null) => {
        setDrawerMode(mode);
        if (mode === 'ADD') {
            setFormData(activeTab === 'EMPLOYEE' 
                ? { name: "", email: "", role: "staff", phone: "" } 
                : { name: "", contact: "", email: "", phone: "", address: "" }
            );
        } else {
            setSelectedId(item.id);
            setFormData(activeTab === 'EMPLOYEE'
                ? { name: item.name, email: item.email, role: item.role, phone: item.phone }
                : { name: item.name, contact: item.contact_person, email: item.email, phone: item.phone, address: item.address }
            );
        }
    };

    const handleSave = async () => {
        try {
            const payload = { ...formData, type: activeTab };
            if (drawerMode === 'ADD') {
                await axios.post('/people', payload);
            } else {
                await axios.patch(`/people/${selectedId}`, payload);
            }
            setDrawerMode(null);
            fetchData();
            alert("Saved Successfully!");
        } catch (error) { alert("Failed to save"); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete this record?")) return;
        try {
            await axios.delete(`/people/${id}`, { params: { type: activeTab } });
            fetchData();
        } catch (error) { alert("Delete failed"); }
    };

    // --- RENDER FORM (Helper Function) ---
    const renderFormContent = () => {
        if (activeTab === 'EMPLOYEE') return (
            <div className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <select className="w-full pl-10 border p-2.5 rounded-lg text-sm bg-white" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="08..."/>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="email@company.com"/>
                    </div>
                </div>
                {drawerMode === 'ADD' && (
                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                        Default password for new employee is <b>123456</b>. They can change it later.
                    </div>
                )}
            </div>
        );

        // SUPPLIER FORM
        return (
            <div className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Company Name</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        <input className="w-full pl-10 border p-2.5 rounded-lg text-sm font-bold" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. PT. Sumber Makmur"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Contact Person</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} placeholder="Mr. Budi"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="08..."/>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        <input className="w-full pl-10 border p-2.5 rounded-lg text-sm" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="sales@vendor.com"/>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Address</label>
                    <textarea className="w-full border p-2.5 rounded-lg text-sm h-20" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Full address..."></textarea>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen bg-white font-sans text-gray-900 flex flex-col">
            
            {/* HEADER */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">People & Partners</h1>
                        <p className="text-sm text-gray-500">Manage your employees access and supplier database.</p>
                    </div>
                    <button onClick={()=>openDrawer('ADD')} className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 shadow-lg">
                        <Plus size={16}/> Add {activeTab === 'EMPLOYEE' ? 'Employee' : 'Supplier'}
                    </button>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={()=>setActiveTab('EMPLOYEE')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition ${activeTab === 'EMPLOYEE' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>
                            <User size={16}/> Employees
                        </button>
                        <button onClick={()=>setActiveTab('SUPPLIER')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition ${activeTab === 'SUPPLIER' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>
                            <Truck size={16}/> Suppliers
                        </button>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Search name..." value={keyword} onChange={e=>setKeyword(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 p-8 bg-gray-50/30">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 text-[11px] font-bold text-gray-400 uppercase w-10">#</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase">{activeTab === 'EMPLOYEE' ? 'Name & Role' : 'Company Name'}</th>
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase">Contact Info</th>
                                {activeTab === 'SUPPLIER' && <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase">Address</th>}
                                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 text-sm">No data found.</td></tr>
                            ) : data.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition group">
                                    <td className="py-4 pl-6 text-xs text-gray-400">{idx+1}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${activeTab === 'EMPLOYEE' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                                {item.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                {activeTab === 'EMPLOYEE' ? (
                                                    <span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">{item.role}</span>
                                                ) : (
                                                    <p className="text-xs text-gray-500">PIC: {item.contact_person || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1">
                                            {item.email && <span className="text-xs text-gray-600 flex items-center gap-1"><Mail size={12}/> {item.email}</span>}
                                            {item.phone && <span className="text-xs text-gray-600 flex items-center gap-1"><Phone size={12}/> {item.phone}</span>}
                                        </div>
                                    </td>
                                    {activeTab === 'SUPPLIER' && (
                                        <td className="py-4 px-4 text-xs text-gray-500 truncate max-w-[200px]">{item.address || '-'}</td>
                                    )}
                                    <td className="py-4 px-4 text-right pr-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={()=>openDrawer('EDIT', item)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit size={16}/></button>
                                            <button onClick={()=>handleDelete(item.id)} className="p-1.5 hover:bg-gray-100 rounded text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DRAWER */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${drawerMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setDrawerMode(null)} />
                <div className={`absolute inset-y-0 right-0 w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${drawerMode ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">{drawerMode === 'ADD' ? 'Add New' : 'Edit'} {activeTab === 'EMPLOYEE' ? 'Employee' : 'Supplier'}</h2>
                        <button onClick={() => setDrawerMode(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8">{renderFormContent()}</div>
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button onClick={() => setDrawerMode(null)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-white transition">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800 transition flex items-center gap-2"><Save size={16}/> Save Data</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default People;