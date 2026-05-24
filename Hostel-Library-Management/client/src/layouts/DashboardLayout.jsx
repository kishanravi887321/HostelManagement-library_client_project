import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear the authentication token from browser storage
    localStorage.removeItem("token");
    
    // 2. Route the application back to the login page immediately
    navigate("/login", { replace: true });
    
    // 3. Trigger a quick reload to clear local state variables in App.jsx
    window.location.reload();
  };

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="side-rail-inner">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="brand-badge">H</div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Operations Suite</p>
                <h1 className="text-xl font-semibold text-white">Hostel ERP</h1>
              </div>
            </div>

            <nav className="space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-white/70"></span>
                Dashboard
              </NavLink>
              <NavLink
                to="/students"
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-white/70"></span>
                Hostel Students
              </NavLink>
              <NavLink
                to="/library"
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-white/70"></span>
                Library
              </NavLink>
              <NavLink
                to="/directory"
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-white/70"></span>
                Student Directory
              </NavLink>
            </nav>
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
          <button onClick={handleLogout} className="btn-ghost flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Logout
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}