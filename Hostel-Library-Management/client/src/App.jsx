import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SeatGrid from "./components/SeatGrid";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Login from "./pages/Login";
import StudentDirectory from "./pages/StudentDirectory";
import Students from "./pages/Students";

export default function App() {
  // Check if a token exists to maintain login state
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // 🆕 Synchronize login status if local storage drops the token (e.g., on logout)
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    // Listen for storage changes across tabs or custom logout triggers
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route: If already logged in, redirect to Dashboard */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} 
        />

        {/* Dashboard Layout Routes protected by authentication status */}
        <Route 
          path="/" 
          element={isLoggedIn ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="students" element={<Students />} />
          
          {/* Registered Student Directory Route */}
          <Route path="directory" element={<StudentDirectory />} />

          {/* Seat Grid Route */}
          <Route path="seats" element={<SeatGrid />} />
        </Route>

        {/* Catch-all route to prevent blank pages */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}