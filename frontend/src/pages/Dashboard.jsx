import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { DollarSign, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/dashboard-stats');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, []);

    if (!data) return <div className="p-8 text-gray-500">Loading Dashboard Data...</div>;

    return (
        <div className="w-full h-full flex flex-col gap-6">
            
            {/* 1. TOP CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Card Component */}
                <StatsCard 
                    title="Total Inventory Asset" 
                    value={data.summary.totalAsset} 
                    desc="Combined Raw Materials & Finished Goods"
                    icon={<DollarSign size={24} />}
                    iconBg="bg-gray-100 text-gray-700"
                    descColor="text-green-600"
                />
                <StatsCard 
                    title="Material Low Stock" 
                    value={data.summary.lowStock} 
                    desc="Items need restock"
                    icon={<AlertTriangle size={24} />}
                    iconBg="bg-red-50 text-red-500 border border-red-100"
                    valueColor="text-red-600"
                    descColor="text-red-500"
                />
                <StatsCard 
                    title="Today's Inbound" 
                    value={data.summary.inbound} 
                    desc="+8% from yesterday"
                    icon={<ArrowDown size={24} />}
                    iconBg="bg-green-50 text-green-600 border border-green-100"
                    descColor="text-green-600"
                />
                <StatsCard 
                    title="Today's Outbound" 
                    value={data.summary.outbound} 
                    desc="Materials & Sales"
                    icon={<ArrowUp size={24} />}
                    iconBg="bg-orange-50 text-orange-500 border border-orange-100"
                    descColor="text-orange-500"
                />
            </div>

            {/* 2. MIDDLE SECTION: CHART & TABLE */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
                
                {/* CHART SECTION (Wider) */}
                <div className="xl:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-8">Weekly Material Usage</h3>
                    <div className="flex-1 w-full min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weeklyUsage} barGap={8} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fill: '#64748b'}} dy={15} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', padding: '10px 15px'}}
                                    cursor={{fill: '#f1f5f9'}}
                                />
                                <Legend iconType="square" wrapperStyle={{paddingTop: '30px', fontSize: '14px'}} />
                                <Bar dataKey="leather" name="Leather (sq.ft)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="rubber" name="Rubber (pairs)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="fabric" name="Fabric (meters)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CRITICAL STOCK TABLE */}
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Critical Stock Alerts</h3>
                        <p className="text-sm text-gray-400 mt-1">Raw materials requiring restock • Finished goods</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="pb-4 pl-1">Material Name</th>
                                    <th className="pb-4">Stock</th>
                                    <th className="pb-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.criticalStock.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 group transition">
                                        <td className="py-4 pl-1">
                                            <p className="font-semibold text-gray-700 text-sm group-hover:text-blue-600 transition">{item.name}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className="font-bold text-red-500 text-sm">{item.stock}</span>
                                            <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded shadow-md shadow-red-200 transition">
                                                Restock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM SECTION: RECENT ACTIVITY */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Warehouse Activity</h3>
                <div className="space-y-1">
                    {data.recentActivity.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-4 rounded-lg transition border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${log.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {log.type === 'in' ? <ArrowDown size={20}/> : <ArrowUp size={20}/>}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-800">{log.title}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{log.desc}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${log.type === 'in' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                    {log.val}
                                </span>
                                <p className="text-xs text-gray-400 mt-2 font-medium">{log.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Reusable Component untuk Card atas
const StatsCard = ({ title, value, desc, icon, iconBg, valueColor = "text-gray-800", descColor }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">{title}</p>
                <h3 className={`text-3xl font-extrabold ${valueColor} tracking-tight`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${iconBg}`}>
                {icon}
            </div>
        </div>
        <p className={`text-xs font-semibold ${descColor}`}>{desc}</p>
    </div>
);

export default Dashboard;