import { app } from 'electron';
import path from 'node:path';

export function getAssetsDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(app.getAppPath(), 'assets');
}

export function getAssetPath(fileName: string): string {
  return path.join(getAssetsDir(), fileName);
}
