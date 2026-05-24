import { Link, Outlet, useNavigate } from "react-router-dom";

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
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-600 via-purple-700 to-indigo-950 text-white p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8 tracking-wide drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">
            Hostel ERP
          </h1>

          <nav className="space-y-3">
            <Link to="/" className="block p-2 rounded transition hover:bg-white/10 active:bg-purple-500/20">
              Dashboard
            </Link>

            <Link to="/students" className="block p-2 rounded transition hover:bg-white/10 active:bg-purple-500/20">
              Hostel Students
            </Link>

            <Link to="/library" className="block p-2 rounded transition hover:bg-white/10 active:bg-purple-500/20">
              Library
            </Link>

            {/* 🆕 Replaced Payments with Student Directory */}
            <Link to="/directory" className="block p-2 rounded transition hover:bg-white/10 active:bg-purple-500/20">
              Student Directory
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Admin Panel</h2>
          
          {/* 🆕 Sleek Logout Button inside the top Navbar */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3.5 rounded-lg border border-red-200 transition-colors shadow-sm"
          >
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

        {/* Page Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>

      </div>

    </div>
  );
}