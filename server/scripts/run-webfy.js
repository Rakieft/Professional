const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const mode = process.argv.includes("--dev") ? "dev" : "start";
const projectRoot = path.resolve(__dirname, "..", "..");
const port = Number(process.env.PORT || 5000);

function readLines(output) {
  return output
    .toString()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getPidsOnPort(targetPort) {
  try {
    if (process.platform === "win32") {
      const output = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${targetPort} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
        { stdio: ["ignore", "pipe", "ignore"] }
      );

      return [...new Set(readLines(output).map((value) => Number(value)).filter(Number.isFinite))];
    }

    const output = execSync(`lsof -ti tcp:${targetPort}`, {
      stdio: ["ignore", "pipe", "ignore"]
    });

    return [...new Set(readLines(output).map((value) => Number(value)).filter(Number.isFinite))];
  } catch (_error) {
    return [];
  }
}

function killPid(pid) {
  if (!pid || pid === process.pid) {
    return;
  }

  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: ["ignore", "ignore", "ignore"] });
      return;
    }

    process.kill(pid, "SIGTERM");
  } catch (_error) {
    try {
      if (process.platform !== "win32") {
        process.kill(pid, "SIGKILL");
      }
    } catch (_innerError) {
      // Ignore final failure; the child process start will surface any remaining issue.
    }
  }
}

function freePort(targetPort) {
  const pids = getPidsOnPort(targetPort);

  if (!pids.length) {
    return;
  }

  console.log(`Port ${targetPort} occupe. Liberation en cours...`);
  pids.forEach(killPid);
}

function resolveCommand() {
  if (mode === "dev") {
    const nodemonName = process.platform === "win32" ? "nodemon.cmd" : "nodemon";
    const nodemonPath = path.join(projectRoot, "node_modules", ".bin", nodemonName);

    if (!fs.existsSync(nodemonPath)) {
      throw new Error("nodemon est introuvable. Lancez npm install puis reessayez.");
    }

    return {
      command: nodemonPath,
      args: ["server.js"]
    };
  }

  return {
    command: process.execPath,
    args: ["server.js"]
  };
}

function launch() {
  freePort(port);

  const { command, args } = resolveCommand();
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`Impossible de lancer WebFy: ${error.message}`);
    process.exit(1);
  });
}

launch();
