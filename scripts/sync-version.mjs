import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const versionPath = path.join(rootDir, "VERSION");
const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const tauriConfigPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(rootDir, "src-tauri", "Cargo.toml");

const version = readFileSync(versionPath, "utf8").trim();

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`VERSION must contain a valid semver value, received "${version}"`);
}

const updateJsonVersion = (filePath, updater) => {
  const content = JSON.parse(readFileSync(filePath, "utf8"));
  updater(content);
  writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`);
};

updateJsonVersion(packageJsonPath, (pkg) => {
  pkg.version = version;
});

updateJsonVersion(packageLockPath, (lockfile) => {
  lockfile.version = version;

  if (lockfile.packages?.[""]) {
    lockfile.packages[""].version = version;
  }
});

updateJsonVersion(tauriConfigPath, (tauriConfig) => {
  tauriConfig.version = version;
});

const cargoToml = readFileSync(cargoTomlPath, "utf8");
const cargoVersionPattern = /^version = "[^"]+"$/m;

if (!cargoVersionPattern.test(cargoToml)) {
  throw new Error("Could not find a version entry in src-tauri/Cargo.toml");
}

const nextCargoToml = cargoToml.replace(
  cargoVersionPattern,
  `version = "${version}"`,
);

writeFileSync(cargoTomlPath, nextCargoToml);

console.log(`Synchronized project version to ${version}`);
