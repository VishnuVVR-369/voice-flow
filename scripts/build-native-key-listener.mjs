import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, 'native', 'global-key-listener', 'Cargo.toml');
const resourcesDir = path.join(projectRoot, 'resources', 'binaries');

function resolveTargetTriple() {
  if (process.platform === 'darwin') {
    return `${process.arch === 'arm64' ? 'aarch64' : 'x86_64'}-apple-darwin`;
  }

  if (process.platform === 'win32') {
    return 'x86_64-pc-windows-msvc';
  }

  return null;
}

const targetTriple = resolveTargetTriple();
if (!targetTriple) {
  console.log(`[build-native-key-listener] Skipping unsupported platform: ${process.platform}`);
  process.exit(0);
}

if (!existsSync(manifestPath)) {
  console.error(`[build-native-key-listener] Missing Cargo manifest: ${manifestPath}`);
  process.exit(1);
}

const cargoArgs = [
  'build',
  '--release',
  '--manifest-path',
  manifestPath,
  '--target',
  targetTriple,
];

const result = spawnSync('cargo', cargoArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    CARGO_TERM_COLOR: process.stdout.isTTY ? 'always' : 'never',
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const binaryName = process.platform === 'win32' ? 'global-key-listener.exe' : 'global-key-listener';
const builtBinaryPath = path.join(
  projectRoot,
  'native',
  'global-key-listener',
  'target',
  targetTriple,
  'release',
  binaryName,
);

mkdirSync(resourcesDir, { recursive: true });
copyFileSync(builtBinaryPath, path.join(resourcesDir, binaryName));

console.log(`[build-native-key-listener] Ready: ${path.relative(projectRoot, builtBinaryPath)}`);
console.log(`[build-native-key-listener] Copied to: ${path.relative(projectRoot, path.join(resourcesDir, binaryName))}`);
