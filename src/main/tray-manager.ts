import { Tray, Menu, nativeImage } from 'electron';
import type { NativeImage } from 'electron';
import { getAssetPath } from './assets-path';

export class TrayManager {
  private tray: Tray | null = null;
  private onQuit: () => void;
  private onOpenMainWindow: () => void;

  constructor(onQuit: () => void, onOpenMainWindow: () => void) {
    this.onQuit = onQuit;
    this.onOpenMainWindow = onOpenMainWindow;
  }

  create(): void {
    this.tray = new Tray(this.createTrayIcon());
    this.tray.setToolTip('VoiceFlow - Voice to Text');
    this.updateMenu('idle');
  }

  updateMenu(status: string): void {
    if (!this.tray) return;

    const statusText = status === 'recording' ? 'Recording...'
      : status === 'transcribing' ? 'Transcribing...'
      : 'Ready';

    const contextMenu = Menu.buildFromTemplate([
      { label: `VoiceFlow - ${statusText}`, enabled: false },
      { type: 'separator' },
      { label: 'Use configured shortcuts from Settings', enabled: false },
      { type: 'separator' },
      { label: 'Open VoiceFlow', click: () => this.onOpenMainWindow() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.onQuit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private createTrayIcon(): NativeImage {
    return nativeImage.createFromPath(getAssetPath('icon.png')).resize({
      width: 18,
      height: 18,
      quality: 'best',
    });
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}
