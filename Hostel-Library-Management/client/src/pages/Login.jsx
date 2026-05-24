import axios from "axios";
import { useState } from "react";
import { API_BASE_URL } from "../config/api";

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(false);

    // Simple client-side validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      // Sending request to backend
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      
      if (res.data.token) {
        // Save token to local storage so user stays logged in
        localStorage.setItem("token", res.data.token);
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-gray-100 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6 transform transition-all">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-orange-100 text-orange-600 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Hostel & Library Management Portal</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="admin@management.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Remember / Forgot Link placeholder visually */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 accent-orange-600" />
              <span>Remember me</span>
            </label>
            <span className="text-orange-600 hover:underline cursor-pointer">Forgot Password?</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 font-semibold text-sm rounded-lg shadow-md text-white transition duration-200 
              ${loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 active:scale-[0.98]"}`}
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400">
          Secure Cloud Access &bull; Authorization Required
        </p>
      </div>
    </div>
  );
}