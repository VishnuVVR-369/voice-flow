import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { OVERLAY_IDLE_WIDTH, OVERLAY_IDLE_HEIGHT } from '../shared/constants';
import { getAssetPath } from './assets-path';

declare const OVERLAY_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const OVERLAY_WINDOW_VITE_NAME: string;

const BOTTOM_PADDING = 48;
const POSITION_INTERVAL_MS = process.platform === 'win32' ? 750 : 250;

// Store the display-anchored bottom position so we can grow upward
let anchorDisplay: Electron.Display | null = null;
let overlayPositionerInterval: NodeJS.Timeout | null = null;
let displayMetricsListener: ((event: Electron.Event, display: Electron.Display, changedMetrics: string[]) => void) | null = null;

export function repositionOverlayTocursor(overlay: BrowserWindow): void {
  if (overlay.isDestroyed()) {
    return;
  }

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  anchorDisplay = display;
  const { x: areaX, y: areaY, width: areaW, height: areaH } = display.workArea;
  const { width, height } = overlay.getBounds();

  const x = Math.round(areaX + areaW / 2 - width / 2);
  const y = areaY + areaH - height - BOTTOM_PADDING;

  overlay.setBounds({ x, y, width, height });
}

/**
 * Resize overlay dynamically, anchoring the bottom edge.
 * Used when transcript card expands/collapses.
 */
export function resizeOverlay(overlay: BrowserWindow, width: number, height: number): void {
  const display = anchorDisplay || screen.getPrimaryDisplay();
  const { x: areaX, y: areaY, width: areaW, height: areaH } = display.workArea;

  // Keep the bottom edge anchored at its original position
  const bottomY = areaY + areaH - BOTTOM_PADDING;
  const x = Math.round(areaX + areaW / 2 - width / 2);
  const y = bottomY - height;

  overlay.setBounds({ x, y, width, height });
}

export function startOverlayPositioner(overlay: BrowserWindow): void {
  stopOverlayPositioner();

  const updatePosition = () => {
    if (overlay.isDestroyed()) {
      stopOverlayPositioner();
      return;
    }

    repositionOverlayTocursor(overlay);
  };

  if (!displayMetricsListener) {
    displayMetricsListener = () => {
      updatePosition();
    };
    screen.on('display-metrics-changed', displayMetricsListener);
  }

  updatePosition();
  overlayPositionerInterval = setInterval(updatePosition, POSITION_INTERVAL_MS);
  overlay.once('closed', () => stopOverlayPositioner());
}

export function stopOverlayPositioner(): void {
  if (overlayPositionerInterval) {
    clearInterval(overlayPositionerInterval);
    overlayPositionerInterval = null;
  }

  if (displayMetricsListener) {
    screen.removeListener('display-metrics-changed', displayMetricsListener);
    displayMetricsListener = null;
  }
}

export function showOverlayWindow(overlay: BrowserWindow): void {
  if (typeof overlay.showInactive === 'function') {
    overlay.showInactive();
    overlay.moveTop();
    return;
  }

  overlay.show();
  overlay.moveTop();
}

export function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x: areaX, y: areaY, width: areaW, height: areaH } = primaryDisplay.workArea;

  const overlay = new BrowserWindow({
    width: OVERLAY_IDLE_WIDTH,
    height: OVERLAY_IDLE_HEIGHT + 24,
    x: Math.round(areaX + areaW / 2 - OVERLAY_IDLE_WIDTH / 2),
    y: areaY + areaH - (OVERLAY_IDLE_HEIGHT + 24) - BOTTOM_PADDING,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    focusable: false,
    hasShadow: false,
    type: 'panel',
    hiddenInMissionControl: true,
    show: false,
    icon: getAssetPath('icon.png'),
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.setFullScreenable(false);

  if (process.platform === 'darwin') {
    overlay.setAlwaysOnTop(true, 'screen-saver', 1);
    overlay.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  } else {
    overlay.setAlwaysOnTop(true, 'screen-saver');
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  if (OVERLAY_WINDOW_VITE_DEV_SERVER_URL) {
    const url = `${OVERLAY_WINDOW_VITE_DEV_SERVER_URL.replace(/\/$/, '')}/index.html`;
    overlay.loadURL(url);
  } else {
    overlay.loadFile(path.join(__dirname, `../renderer/${OVERLAY_WINDOW_VITE_NAME}/index.html`));
  }

  overlay.once('ready-to-show', () => {
    repositionOverlayTocursor(overlay);
    showOverlayWindow(overlay);
  });

  return overlay;
}
