import { existsSync } from "fs";
import { execSync, spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const DEFAULT_BE_PORT = 4000;
const DEFAULT_FE_PORT = 5173;

function parseArgs() {
  const args = process.argv.slice(2);
  let bePort = DEFAULT_BE_PORT;
  let fePort = DEFAULT_FE_PORT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--be-port" && args[i + 1]) bePort = Number(args[++i]);
    if (args[i] === "--fe-port" && args[i + 1]) fePort = Number(args[++i]);
  }

  return { bePort, fePort };
}

function checkAndInstall(name, dir) {
  const modulesPath = resolve(dir, "node_modules");
  if (!existsSync(modulesPath)) {
    console.log(`\n📦 ${name}: node_modules not found — installing dependencies...\n`);
    execSync("npm install", { cwd: dir, stdio: "inherit" });
    console.log(`\n✅ ${name}: dependencies installed.\n`);
  } else {
    console.log(`✅ ${name}: node_modules found.`);
  }
}

const rootModules = resolve(root, "node_modules");
if (!existsSync(rootModules)) {
  console.log("\n📦 Root: node_modules not found — installing dependencies...\n");
  execSync("npm install", { cwd: root, stdio: "inherit" });
  console.log("\n✅ Root: dependencies installed.\n");
}

checkAndInstall("Backend", resolve(root, "backend"));
checkAndInstall("Frontend", resolve(root, "frontend"));

const { bePort, fePort } = parseArgs();

console.log(`\n🚀 Starting backend (:${bePort}) and frontend (:${fePort})...\n`);

const concurrently = resolve(root, "node_modules", ".bin", "concurrently");

const cmd = [
  concurrently,
  "--names", "BACKEND,FRONTEND",
  "--prefix-colors", "blue,magenta",
  "--kill-others-on-fail",
  `"cd backend && PORT=${bePort} FRONTEND_ORIGIN=http://localhost:${fePort} npm run dev"`,
  `"cd frontend && VITE_BE_PORT=${bePort} npm run dev -- --port ${fePort}"`,
].join(" ");

const child = spawn(cmd, {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
