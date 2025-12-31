import { useNavigate } from "react-router-dom";
import { Warehouse, Lock, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Background Glow Effect (Radial Gradient di tengah) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in-up">

        {/* Logo Box */}
        <div className="bg-blue-500 p-5 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] mb-8 transition-transform hover:scale-105 duration-500">
           <Warehouse className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>

        {/* Small Welcome Text */}
        <h2 className="text-xs font-bold tracking-[0.3em] text-slate-500 mb-6 uppercase">
          Welcome
        </h2>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
          Warehouse <br />
          Management <br />
          System
        </h1>

        {/* Subtitle / Company Name */}
        <p className="text-slate-400 text-base md:text-lg mb-12 font-light tracking-wide">
          CV. SAMHARI Footwear Production
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/login')}
          className="group bg-blue-500 hover:bg-blue-400 text-white px-10 py-3.5 rounded-lg font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] flex items-center gap-3 transform hover:-translate-y-1"
        >
          ENTER SYSTEM
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Status Badges Section */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
            {/* Badge 1 */}
            <div className="px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 text-slate-500 text-[10px] md:text-xs font-medium tracking-wide">
                Restricted Access
            </div>
            {/* Badge 2 */}
            <div className="px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 text-slate-500 text-[10px] md:text-xs font-medium tracking-wide">
                System v1.0
            </div>
            {/* Badge 3 (Online Status) */}
            <div className="px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 text-green-500 text-[10px] md:text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                Server Online
            </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 flex items-center gap-2 text-slate-600 text-[10px] tracking-wider opacity-70">
            <Lock className="w-3 h-3" />
            <span>Secure Connection Established</span>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="absolute bottom-6 text-slate-700 text-[10px] tracking-wide font-medium">
        © 2024 Footwear Enterprise Group - Authorized Personnel Only
      </div>

    </div>
  );
};

export default Landing;