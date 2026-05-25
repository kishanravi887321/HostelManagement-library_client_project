import axios from "axios";
import { useState } from "react";
import { API_BASE_URL } from "../config/api";

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
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
    if (!formData.username || !formData.password) {
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
      setError(err.response?.data?.message || "Invalid username or password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full panel p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 font-bold">
            H
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700">Hostel ERP</p>
            <h2 className="text-3xl font-semibold text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500">Sign in to manage hostel and library operations.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Username</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded accent-teal-600" />
              <span>Remember me</span>
            </label>
            <span className="text-amber-700 hover:underline cursor-pointer">Forgot Password?</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Secure access for authorized staff only.
        </p>
      </div>
    </div>
  );
}