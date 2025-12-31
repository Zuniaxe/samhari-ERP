import React, { useState } from 'react';
import axios from '../api/axios'; // Pastikan path ini benar sesuai struktur folder Anda
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, ChevronDown, CheckSquare } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Administrator'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const roles = ['Administrator', 'Warehouse Keeper'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Mengirim data ke Backend
      const response = await axios.post('/login', {
        username: username,
        password: password
      });
      
      // Jika sukses:
      const accessToken = response.data.accessToken;
      const userData = response.data.user;

      // 1. Simpan Token & Data User
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // 2. Pindah ke Dashboard
      navigate("/dashboard");

    } catch (error) {
      // Jika gagal:
      if (!error?.response) {
        setErrorMessage('Tidak ada respon dari server. Pastikan backend nyala.');
      } else if (error.response?.status === 400) {
        setErrorMessage('Password salah.');
      } else if (error.response?.status === 404) {
        setErrorMessage('Username tidak ditemukan.');
      } else {
        setErrorMessage('Login gagal.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center font-sans">
      <div className="bg-[#1e293b] p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="bg-blue-600 w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
            <Building2 color="white" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">CV. SAMHARI</h2>
          <p className="text-gray-400 text-sm mt-1">Warehouse Management System</p>
        </div>

        {/* Pesan Error */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-600"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-600 pr-10"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Role Dropdown (Visual Only - Backend determines actual permission) */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Login As</label>
            <div className="relative">
              <button
                type="button"
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex justify-between items-center"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                <span>{role}</span>
                <ChevronDown size={20} className="text-gray-500" />
              </button>
              {isRoleDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-[#0f172a] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="w-full text-left p-3 text-white hover:bg-[#1e293b] transition text-sm"
                      onClick={() => {
                        setRole(r);
                        setIsRoleDropdownOpen(false);
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <button type="button" className="flex items-center text-gray-400 hover:text-gray-300 text-sm focus:outline-none">
              <div className="w-5 h-5 border border-gray-700 rounded mr-2 flex items-center justify-center bg-[#0f172a]">
                <CheckSquare size={16} className="text-transparent" /> 
                {/* Logika remember me bisa ditambahkan nanti jika perlu */}
              </div>
              Simpan informasi login
            </button>
          </div>

          {/* Submit Button */}
          <button 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/30 flex justify-center"
          >
            {isLoading ? 'Memproses...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          <span className="hover:text-gray-300 cursor-pointer transition">Daftar Akun</span> • 
          <span className="hover:text-gray-300 cursor-pointer transition mx-1">Kontak Support</span> • 
          <span className="hover:text-gray-300 cursor-pointer transition">Kebijakan Privasi</span>
        </div>
      </div>
    </div>
  );
};

export default Login;