module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/node_modules/node-global-key-listener/bin/**/*',
    },
    ignore: (file) => {
      if (!file) return false;

      if (file === '/.vite' || file.startsWith('/.vite/')) return false;
      if (file === '/package.json') return false;
      if (file === '/node_modules' || file.startsWith('/node_modules/')) return false;

      return true;
    },
    icon: 'assets/icon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.ts',
            config: 'vite.main.config.ts',
            target: 'main',
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.ts',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.app.config.ts',
          },
          {
            name: 'overlay_window',
            config: 'vite.overlay.config.ts',
          },
        ],
      },
    },
  ],
};
