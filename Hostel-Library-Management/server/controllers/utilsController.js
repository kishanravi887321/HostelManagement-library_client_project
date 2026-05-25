import dailyLines from "../data/dailyLines.json" with { type: "json" };
import { getAdminCredentials } from "../utils/adminCredentialsStore.js";

const ADMIN_TOKEN = "secure_hostel_library_management_token_2026";

const seededRandom = (seed) => {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
};

const seedFromString = (s) => {
  let seed = 0;
  for (let i = 0; i < s.length; i++) seed = (seed * 131 + s.charCodeAt(i)) >>> 0;
  return seededRandom(seed);
};

const getGreetingAndDaily = async (req, res) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const credentials = getAdminCredentials();
  const username = credentials.username || "Admin";

  const tz = req.query.tz || "UTC";

  // determine hour in provided timezone
  let hour = 12;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz });
    const hourStr = formatter.format(new Date());
    hour = parseInt(String(hourStr).replace(/[^0-9]/g, ""), 10) || 12;
  } catch (err) {
    hour = new Date().getHours();
  }

  let timeWord = "Hello";
  if (hour >= 5 && hour < 12) timeWord = "Good Morning";
  else if (hour >= 12 && hour < 17) timeWord = "Good Afternoon";
  else if (hour >= 17 && hour < 21) timeWord = "Good Evening";

  const shortName = username.split(" ")[0] || username;
  const greetingLine = `${timeWord} ${shortName} !`;

  // Select a deterministic daily line from internal JSON to avoid external dependency
  const todayKey = new Date().toISOString().slice(0, 10);
  const picker = seedFromString(`${todayKey}-${username}`);
  const idx = Math.floor(picker() * dailyLines.length);
  const dailyLine = dailyLines[idx] || "Keep going — small steps win big.";
  // emoji chosen deterministically
  const emojiChoices = ["✨", "🎯", "😊", "💡", "🌟", "🔥", "🌱"];
  const dailyEmoji = emojiChoices[Math.floor(picker() * emojiChoices.length)];
  // Set caching headers: dailyLine is stable for the remainder of the UTC day.
  try {
    const now = new Date();
    const nextMidnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    let ttl = Math.floor((nextMidnightUtc.getTime() - now.getTime()) / 1000);
    if (!isFinite(ttl) || ttl <= 0) ttl = 60;

    res.setHeader("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`);
    res.setHeader("Expires", new Date(Date.now() + ttl * 1000).toUTCString());
    res.setHeader("Vary", "Authorization, Accept-Encoding");
  } catch (err) {
    // ignore header errors
  }

  return res.json({ username, greetingLine, dailyLine, dailyEmoji });
};

export { getGreetingAndDaily };
