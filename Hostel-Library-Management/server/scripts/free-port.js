import { execSync } from "node:child_process";

const portArg = process.argv[2];
const port = Number(portArg) || 5000;

const safeRun = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
  } catch {
    return "";
  }
};

const killPortWindows = (targetPort) => {
  const output = safeRun(`netstat -ano | findstr :${targetPort}`);
  if (!output.trim()) {
    console.log(`[predev] Port ${targetPort} is free.`);
    return;
  }

  const pids = [...new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).pop())
      .filter((pid) => /^\d+$/.test(pid) && pid !== "0")
  )];

  if (pids.length === 0) {
    console.log(`[predev] Port ${targetPort} appears occupied, but no PID could be parsed.`);
    return;
  }

  for (const pid of pids) {
    safeRun(`taskkill /PID ${pid} /F`);
  }

  console.log(`[predev] Freed port ${targetPort} by stopping PID(s): ${pids.join(", ")}`);
};

const killPortUnix = (targetPort) => {
  const pidsOutput = safeRun(`lsof -ti tcp:${targetPort}`);
  const pids = pidsOutput
    .split(/\r?\n/)
    .map((pid) => pid.trim())
    .filter((pid) => /^\d+$/.test(pid));

  if (pids.length === 0) {
    console.log(`[predev] Port ${targetPort} is free.`);
    return;
  }

  for (const pid of pids) {
    safeRun(`kill -9 ${pid}`);
  }

  console.log(`[predev] Freed port ${targetPort} by stopping PID(s): ${pids.join(", ")}`);
};

if (process.platform === "win32") {
  killPortWindows(port);
} else {
  killPortUnix(port);
}
