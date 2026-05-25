import axios from "axios";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

export default function DashboardLayout() {
  const navigate = useNavigate();
  

  const handleOpenSecurity = () => navigate("/security");

  const handleNavigate = (path) => navigate(path);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("displayName");
      navigate("/login", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Admin / greeting state
  const [adminName, setAdminName] = useState("Admin");
  const [greetingPrefix, setGreetingPrefix] = useState("Admin Panel");
  const [greetingLine, setGreetingLine] = useState("Welcome");
  const [dailyLine, setDailyLine] = useState("");
  const [greetingEmoji, setGreetingEmoji] = useState("👋");
  const [dailyEmoji, setDailyEmoji] = useState("✨");
  const [dailyVisible, setDailyVisible] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState("");

  const fetchServerGreeting = async (displayName) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await axios.get(`${API_BASE_URL}/api/utils/greeting`, {
        params: { tz, displayName: displayName || "" },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || {};
      if (data.dailyLine) setDailyLine(data.dailyLine);
      if (data.dailyEmoji) setDailyEmoji(data.dailyEmoji);
      // trigger fade-in
      setTimeout(() => setDailyVisible(true), 60);
    } catch (err) {
      // ignore
    }
  };

  const seededRandom = (seed) => {
    // simple mulberry32 PRNG
    let t = seed >>> 0;
    return function() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  };

  const pickDailyLine = (dateStr, name) => {
    const words1 = [
      "Keep going",
      "Shine on",
      "You matter",
      "Embrace today",
      "Make waves",
      "Stay curious",
      "Be kind",
      "Chase joy",
      "Create smiles",
      "Spread warmth"
    ];
    const words2 = [
      "— small steps win big.",
      "— coffee and courage.",
      "— the world needs you.",
      "— one page at a time.",
      "— your effort counts.",
      "— good vibes only.",
      "— kindness always wins.",
      "— bring your best self.",
      "— today is yours.",
      "— keep smiling."
    ];

    // Seed from date and name so it's stable per day+admin
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
    for (let i = 0; i < (name || "").length; i++) seed = (seed * 131 + name.charCodeAt(i)) >>> 0;

    const rand = seededRandom(seed);
    const a = Math.floor(rand() * words1.length);
    const b = Math.floor(rand() * words2.length);

    // Construct a short uplifting line
    return `${words1[a]} ${words2[b]}`;
  };

  const seedFromString = (s) => {
    let seed = 0;
    for (let i = 0; i < s.length; i++) seed = (seed * 131 + s.charCodeAt(i)) >>> 0;
    return seededRandom(seed);
  };

  useEffect(() => {
    // fetch server-side greeting + daily line (send timezone so server can compute local greeting)
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        const localDisplayName = localStorage.getItem("displayName") || "";
        // prefer local displayName for visible greeting
        if (localDisplayName) setAdminName(localDisplayName);
        else {
          // if no local name, fallback to server username
          try {
            const cred = await axios.get(`${API_BASE_URL}/api/auth/credentials`, { headers: { Authorization: `Bearer ${token}` } });
            setAdminName(cred.data?.username || "Admin");
          } catch {
            setAdminName("Admin");
          }
        }

        await fetchServerGreeting(localDisplayName);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleEditDisplayName = async () => {
    const current = localStorage.getItem("displayName") || adminName || "";
    const newName = window.prompt("Enter display name for greetings (leave blank to clear):", current);
    if (newName === null) return; // cancelled
    const trimmed = newName.trim();
    if (trimmed) {
      localStorage.setItem("displayName", trimmed);
      setAdminName(trimmed);
      await fetchServerGreeting(trimmed);
    } else {
      localStorage.removeItem("displayName");
      // restore server username if available
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const cred = await axios.get(`${API_BASE_URL}/api/auth/credentials`, { headers: { Authorization: `Bearer ${token}` } });
          setAdminName(cred.data?.username || "Admin");
        } catch {
          setAdminName("Admin");
        }
      } else {
        setAdminName("Admin");
      }
      await fetchServerGreeting("");
    }
  };

  useEffect(() => {
    // compute greeting based on local time and adminName
    const now = new Date();
    const h = now.getHours();
    let timeWord = "Hello";
    if (h >= 5 && h < 12) timeWord = "Good Morning";
    else if (h >= 12 && h < 17) timeWord = "Good Afternoon";
    else if (h >= 17 && h < 21) timeWord = "Good Evening";
    else timeWord = "Hello";

    const shortName = adminName.split(" ")[0] || adminName;
    const fullGreeting = `${timeWord} ${shortName} !`;
    setGreetingPrefix(fullGreeting);
    setGreetingLine(fullGreeting);

    // pick emoji for greeting based on time of day
    let gEmoji = '👋';
    if (timeWord.includes('Morning')) gEmoji = '🌞';
    else if (timeWord.includes('Afternoon')) gEmoji = '☀️';
    else if (timeWord.includes('Evening')) gEmoji = '🌇';
    setGreetingEmoji(gEmoji);

    const todayKey = new Date().toISOString().slice(0, 10);
    setDailyLine(pickDailyLine(todayKey, adminName));

    // deterministic daily emoji accent
    const emojiChoices = ['✨', '🎯', '😊', '💡', '🌟', '🔥', '🌱'];
    const picker = seedFromString(`${todayKey}-${adminName}`);
    setDailyEmoji(emojiChoices[Math.floor(picker() * emojiChoices.length)]);
  }, [adminName]);

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="side-rail-inner">
          <div className="space-y-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="brand-badge">👩</div>
                <div>
                  <h1 className="text-xl font-semibold text-white">JAI HIND LIBRARY</h1>
                </div>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                <NavLink to="/" end className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Dashboard
                </NavLink>
                <NavLink to="/students" className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Hostel Students
                </NavLink>
                <NavLink to="/library" className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Library
                </NavLink>
                <NavLink to="/transactions" className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Transactions
                </NavLink>
                <NavLink to="/directory" className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Student Directory
                </NavLink>
                <NavLink to="/security" className={({isActive}) => `nav-link ${isActive? 'nav-link-active':''}`}>
                  Security
                </NavLink>
                <button type="button" onClick={handleLogout} className="nav-link text-left">
                  Logout
                </button>
              </nav>
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
            <div className="flex items-center gap-3">
              <p className="text-2xl font-semibold text-slate-900">{greetingEmoji} {greetingLine}</p>
              <button
                type="button"
                onClick={handleEditDisplayName}
                className="text-sm text-amber-700 hover:underline"
                aria-label="Edit display name"
              >
                ✏️ Edit
              </button>
            </div>
            <p
              className="text-sm text-slate-600 mt-1"
              style={{
                opacity: dailyVisible ? 1 : 0,
                transform: dailyVisible ? 'translateY(0px)' : 'translateY(6px)',
                transition: 'opacity 600ms ease, transform 600ms ease',
              }}
            >
              {dailyEmoji} {dailyLine}
            </p>
          </div>
        </div>

        <div className="page-content p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}