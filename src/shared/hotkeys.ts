const MODIFIER_ORDER = ['Command', 'Control', 'Alt', 'Shift'] as const;

const MODIFIER_TOKENS = new Set<string>(MODIFIER_ORDER);

const CODE_TOKEN_MAP: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: '\'',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'Space',
  Tab: 'Tab',
  Enter: 'Enter',
  Escape: 'Escape',
  Backspace: 'Backspace',
  Delete: 'Delete',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
};

const GLOBAL_KEY_TOKEN_MAP: Record<string, string> = {
  'LEFT META': 'Command',
  'RIGHT META': 'Command',
  'LEFT CTRL': 'Control',
  'RIGHT CTRL': 'Control',
  'LEFT ALT': 'Alt',
  'RIGHT ALT': 'Alt',
  'LEFT SHIFT': 'Shift',
  'RIGHT SHIFT': 'Shift',
  SPACE: 'Space',
  TAB: 'Tab',
  RETURN: 'Enter',
  ESCAPE: 'Escape',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  BACKTICK: '`',
  MINUS: '-',
  EQUALS: '=',
  'SQUARE BRACKET OPEN': '[',
  'SQUARE BRACKET CLOSE': ']',
  BACKSLASH: '\\',
  SEMICOLON: ';',
  QUOTE: '\'',
  COMMA: ',',
  DOT: '.',
  'FORWARD SLASH': '/',
  'UP ARROW': 'Up',
  'DOWN ARROW': 'Down',
  'LEFT ARROW': 'Left',
  'RIGHT ARROW': 'Right',
};

const DISPLAY_LABELS: Record<string, { darwin: string; default: string }> = {
  Command: { darwin: '⌘', default: 'Cmd' },
  Control: { darwin: '⌃', default: 'Ctrl' },
  Alt: { darwin: '⌥', default: 'Alt' },
  Shift: { darwin: '⇧', default: 'Shift' },
  Space: { darwin: 'Space', default: 'Space' },
  Escape: { darwin: 'Esc', default: 'Esc' },
  Enter: { darwin: 'Return', default: 'Enter' },
  Backspace: { darwin: 'Delete', default: 'Backspace' },
  Delete: { darwin: 'Del', default: 'Del' },
  Up: { darwin: '↑', default: 'Up' },
  Down: { darwin: '↓', default: 'Down' },
  Left: { darwin: '←', default: 'Left' },
  Right: { darwin: '→', default: 'Right' },
  Tab: { darwin: 'Tab', default: 'Tab' },
};

const RESERVED_SHORTCUTS = new Set(['Command+Q', 'Command+W', 'Command+Tab']);

export const MAX_HOTKEY_TOKENS = 5;

export type HotkeyPlatform = 'darwin' | 'default';

export interface HotkeyUpdateResult {
  success: boolean;
  error?: string;
}

export function isModifierToken(token: string): boolean {
  return MODIFIER_TOKENS.has(token);
}

export function normalizeHotkeyTokens(tokens: string[]): string[] {
  const unique = Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
  const modifiers = MODIFIER_ORDER.filter((token) => unique.includes(token));
  const nonModifiers = unique.filter((token) => !MODIFIER_TOKENS.has(token));
  return [...modifiers, ...nonModifiers];
}

export function hotkeyTokensFromAccelerator(hotkey: string): string[] {
  return normalizeHotkeyTokens(hotkey.split('+'));
}

export function hotkeyToAccelerator(tokens: string[]): string {
  return normalizeHotkeyTokens(tokens).join('+');
}

export function formatHotkeyForDisplay(
  hotkey: string,
  platform: HotkeyPlatform = 'darwin',
): string[] {
  return hotkeyTokensFromAccelerator(hotkey).map((token) => {
    const labels = DISPLAY_LABELS[token];
    if (!labels) return token.length === 1 ? token.toUpperCase() : token;
    return labels[platform];
  });
}

export function validateHotkeyTokens(tokens: string[]): string | null {
  const normalized = normalizeHotkeyTokens(tokens);

  if (!normalized.length) return 'Choose at least one key.';
  if (normalized.length > MAX_HOTKEY_TOKENS) return `Use at most ${MAX_HOTKEY_TOKENS} keys.`;
  if (normalized.every(isModifierToken)) return 'Include at least one non-modifier key.';

  const accelerator = hotkeyToAccelerator(normalized);
  if (RESERVED_SHORTCUTS.has(accelerator)) {
    return 'That shortcut is reserved by the system.';
  }

  return null;
}

export function normalizeHotkeyForStorage(hotkey: string): string {
  return hotkeyToAccelerator(hotkeyTokensFromAccelerator(hotkey));
}

export function hotkeyTokenFromEvent(event: { key: string; code: string }): string | null {
  if (event.key === 'Meta') return 'Command';
  if (event.key === 'Control') return 'Control';
  if (event.key === 'Alt') return 'Alt';
  if (event.key === 'Shift') return 'Shift';

  if (event.code in CODE_TOKEN_MAP) return CODE_TOKEN_MAP[event.code];

  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.key)) return event.key.toUpperCase();

  if (event.key.length === 1 && event.key.trim()) {
    return event.key.toUpperCase();
  }

  return null;
}

export function hotkeyTokenFromGlobalKeyName(keyName: string): string | null {
  const normalized = keyName.toUpperCase().trim();

  if (normalized in GLOBAL_KEY_TOKEN_MAP) {
    return GLOBAL_KEY_TOKEN_MAP[normalized];
  }

  if (/^[A-Z]$/.test(normalized)) return normalized;
  if (/^[0-9]$/.test(normalized)) return normalized;
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(normalized)) return normalized;

  return null;
}

export function hotkeyTokensFromGlobalDownMap(isDown: Record<string, boolean>): string[] {
  const tokens = Object.entries(isDown)
    .filter(([, down]) => down)
    .map(([key]) => hotkeyTokenFromGlobalKeyName(key))
    .filter((token): token is string => Boolean(token));

  return normalizeHotkeyTokens(tokens);
}

export function isHotkeyPressed(
  shortcutHotkey: string,
  pressedTokens: string[],
): boolean {
  const shortcutTokens = hotkeyTokensFromAccelerator(shortcutHotkey);
  const normalizedPressed = normalizeHotkeyTokens(pressedTokens);

  if (shortcutTokens.length !== normalizedPressed.length) {
    return false;
  }

  return shortcutTokens.every((token) => normalizedPressed.includes(token));
}
