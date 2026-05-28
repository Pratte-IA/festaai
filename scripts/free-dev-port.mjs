import { execSync } from "node:child_process";

const port = process.argv[2] ?? "3000";

const listPids = () => {
  try {
    return execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
};

const killPids = (pids, signal) => {
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
    } catch {
      // processo ja encerrou
    }
  }
};

const pids = listPids();
if (pids.length === 0) process.exit(0);

killPids(pids, "SIGTERM");
await new Promise((resolve) => setTimeout(resolve, 300));

const remaining = listPids();
if (remaining.length > 0) {
  killPids(remaining, "SIGKILL");
  console.log(`[dev] Porta ${port} liberada (processos encerrados).`);
} else {
  console.log(`[dev] Porta ${port} liberada.`);
}
