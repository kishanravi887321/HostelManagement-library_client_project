import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

export default function Security() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({ username: "", oldPassword: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/auth/credentials`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFormData((prev) => ({ ...prev, username: response.data.username || "" }));
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load credentials.");
      } finally {
        setLoading(false);
      }
    };

    loadCredentials();
  }, [token]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username || !formData.oldPassword || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/credentials`,
        {
          username: formData.username.trim(),
          oldPassword: formData.oldPassword,
          password: formData.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message || "Credentials updated successfully.");
      setFormData((prev) => ({ ...prev, oldPassword: "", password: "", confirmPassword: "" }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto panel p-8 space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700">Security</p>
        <h2 className="text-3xl font-semibold text-slate-900">Change Login Credentials</h2>
        <p className="text-sm text-slate-500">
          Update the username and password used to sign in to the admin panel.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading current credentials...</p>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm font-medium">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm font-medium">{success}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Username</label>
          <input
            type="text"
            name="username"
            className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
            placeholder="Enter new username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Password</label>
          <input
            type="password"
            name="oldPassword"
            className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
            placeholder="Enter current password"
            value={formData.oldPassword}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">New Password</label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
            placeholder="Enter new password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || loading}
            className={`btn-primary ${saving || loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {saving ? "Saving..." : "Update Credentials"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-semibold text-slate-600 bg-white"
          >
            Go Back
          </button>
        </div>
      </form>
    </div>
  );
}
