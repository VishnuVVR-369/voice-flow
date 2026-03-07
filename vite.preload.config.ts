import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

const externalIds = new Set([
  'electron',
  'electron/main',
  'electron/renderer',
  'electron/common',
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]);

function isExternalDependency(id: string): boolean {
  return externalIds.has(id);
}

export default defineConfig({
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: true,
    rollupOptions: {
      external: isExternalDependency,
    },
  },
});
