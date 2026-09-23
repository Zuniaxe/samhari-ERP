import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, Users, Building2, ChevronDown, LogOut, Settings, User } from "lucide-react";

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const isActive = (path) => location.pathname === path;
    const linkStyle = (path) => `flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all ${
        isActive(path) 
        ? 'bg-[#1e293b] text-white border-l-4 border-blue-500' 
        : 'text-gray-400 hover:bg-[#1e293b] hover:text-gray-200'
    }`;

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden print:h-auto print:overflow-visible">
            
            {/* SIDEBAR */}
            <aside className="w-72 bg-[#0f172a] text-white flex flex-col flex-shrink-0 border-r border-gray-800 shadow-2xl z-20 print:hidden">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-gray-800 bg-[#0f172a]">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <Building2 size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-wide text-white">CV. SAMHARI</h1>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Warehouse System</p>
                    </div>
                </div>

                <nav className="flex-1 py-8 space-y-1 overflow-y-auto">
                    <p className="px-6 text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Main Menu</p>
                    <Link to="/dashboard" className={linkStyle('/dashboard')}>
                        <LayoutDashboard size={20}/> Dashboard
                    </Link>
                    <Link to="/inventory" className={linkStyle('/inventory')}>
                        <Package size={20}/> Inventory
                    </Link>
                    <Link to="/operations" className={linkStyle('/operations')}>
                        <ArrowRightLeft size={20}/> Operations
                    </Link>
                    
                    <p className="px-6 text-xs font-bold text-gray-600 uppercase tracking-widest mt-8 mb-3">Administration</p>
                    <Link to="/reports" className={linkStyle('/reports')}>
                        <FileText size={20}/> Reports
                    </Link>
                    <Link to="/people" className={linkStyle('/people')}>
                        <Users size={20}/> People
                    </Link>
                </nav>
                
                {/* Footer Sidebar */}
                <div className="p-6 border-t border-gray-800 text-[10px] text-gray-600 text-center">
                    <p>v2.1.0 Stable Build</p>
                    <p>© 2026 Footwear Ent.</p>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 print:block print:w-full print:h-auto">
                
                {/* TOP HEADER */}
                <header className="h-20 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm z-10 flex-shrink-0 print:hidden">
                    {/* Dev Mode Alert */}
                    <div className="hidden md:flex bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full border border-amber-200 text-xs font-semibold tracking-wide">
                        <span className="mr-2">🚧</span> Dev Mode: Current Role - <span className="font-bold ml-1">Admin (Owner)</span>
                    </div>

                    <div className="flex items-center gap-6">
                         <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded shadow-lg shadow-orange-500/30 transition transform hover:-translate-y-0.5">
                            Switch to Staff
                        </button>
                        
                        {/* PROFILE DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <div 
                                className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer group"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition">{user?.name || 'Admin User'}</p>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">Administrator</p>
                                </div>
                                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-gray-100 group-hover:ring-blue-100 transition">
                                    {user?.name ? user.name.charAt(0) : 'A'}
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}/>
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                        <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@samhari.com'}</p>
                                    </div>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <User size={16} /> Profile Settings
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Settings size={16} /> System Preferences
                                    </button>
                                    <div className="my-1 border-t border-gray-100"></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                    >
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8 scroll-smooth print:overflow-visible print:bg-white print:p-0 print:block">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;