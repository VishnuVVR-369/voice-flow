import { app } from 'electron';
import os from 'node:os';
import path from 'node:path';

function getProjectRoot(): string {
  const appPath = (() => {
    try {
      return app.getAppPath();
    } catch {
      return process.cwd();
    }
  })();

  if (!app.isPackaged && appPath.endsWith(path.join('.vite', 'build'))) {
    return path.resolve(appPath, '..', '..');
  }

  try {
    return appPath;
  } catch {
    return process.cwd();
  }
}

export function getNativeBinaryPath(binaryName: string): string {
  const executableName = process.platform === 'win32' ? `${binaryName}.exe` : binaryName;

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'binaries', executableName);
  }

  if (process.platform === 'darwin') {
    const arch = os.arch() === 'arm64' ? 'aarch64' : 'x86_64';
    return path.join(
      getProjectRoot(),
      'native',
      'global-key-listener',
      'target',
      `${arch}-apple-darwin`,
      'release',
      executableName,
    );
  }

  if (process.platform === 'win32') {
    return path.join(
      getProjectRoot(),
      'native',
      'global-key-listener',
      'target',
      'x86_64-pc-windows-msvc',
      'release',
      executableName,
    );
  }

  return path.join(getProjectRoot(), 'native', 'global-key-listener', 'target', 'release', executableName);
}
