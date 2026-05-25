import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const handleLogout = () => {
    // 1. Clear the authentication token from browser storage
    localStorage.removeItem("token");
    
    // 2. Route the application back to the login page immediately
    navigate("/login", { replace: true });
    
    // 3. Trigger a quick reload to clear local state variables in App.jsx
    window.location.reload();
  };

  const handleOpenSecurity = () => {
    setShowLogoutMenu(false);
    navigate("/security");
  };

  const handleNavigate = (path) => {
    setShowLogoutMenu(false);
    navigate(path);
  };

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="side-rail-inner">
          <div className="space-y-6">
            <div ref={menuRef} className="flex items-center gap-3 relative">
              <button
                type="button"
                onClick={() => setShowLogoutMenu((prev) => !prev)}
                className="brand-badge"
                aria-label="Open logout options"
                title="Open logout options"
              >
                👩
              </button>
              {showLogoutMenu && (
                <div className="absolute left-0 top-14 z-50 w-56 rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate("/")}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/students")}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Hostel Students
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/library")}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Library
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/directory")}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Student Directory
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSecurity}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Security
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-white">JAI HIND LIBRARY</h1>
              </div>
            </div>

          </div>

          <div className="text-xs text-white/70 space-y-1">
            <p className="uppercase tracking-[0.2em]">Status</p>
            <p className="text-sm font-semibold text-white">All systems online</p>
          </div>
        </div>
      </aside>

      <div className="page-shell">
        <div className="top-bar">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-700">Admin Panel</p>
            <p className="text-sm text-slate-600">Manage hostel and library operations in one place.</p>
          </div>
        </div>

        <div className="page-content p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}