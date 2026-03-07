import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

const externalIds = new Set([
  'electron',
  'electron/main',
  'electron/common',
  'node-global-key-listener',
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]);

function isExternalDependency(id: string): boolean {
  return externalIds.has(id) || id.startsWith('node-global-key-listener/');
}

export default defineConfig({
  build: {
    ssr: true,
    rollupOptions: {
      external: isExternalDependency,
    },
  },
});
