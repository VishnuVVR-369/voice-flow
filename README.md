# VoiceFlow

VoiceFlow is a macOS Electron tray app for fast voice-to-text capture. It records from a global shortcut, shows a floating live overlay, sends the captured audio to Groq Whisper for transcription, optionally polishes the text with a Groq chat model, pastes the result into the active app, and stores a local transcript history.

## What It Does

- Runs as a tray-first desktop app with a separate dashboard window and floating overlay
- Supports two global recording modes:
  - Toggle recording with a shortcut press
  - Hold-to-record with a separate shortcut
- Captures microphone audio in the renderer with an `AudioWorklet`, converts it to PCM16, and sends it to the main process
- Uses Groq Whisper (`whisper-large-v3`) to transcribe audio after recording stops
- Optionally rewrites the transcript into cleaner written text with Groq (`openai/gpt-oss-120b`)
- Auto-pastes the final text into the previously focused macOS app through Accessibility automation
- Stores transcript history and dictionary entries locally as JSON files
- Lets users configure:
  - Groq API key
  - microphone source
  - toggle shortcut
  - hold-to-record shortcut
  - AI polish on/off

## Current Platform Scope

This project is built specifically around macOS behavior:

- `node-global-key-listener` is used for hold-to-record key state tracking on macOS
- text injection uses `osascript` and Accessibility permissions
- active app/window/selected text context is captured through JXA (`osascript -l JavaScript`)
- Electron Forge packaging is configured for `darwin` zip and DMG output

It may launch elsewhere, but the implemented workflow is clearly macOS-first.

## How The Flow Works

1. A global shortcut starts recording.
2. The overlay renderer opens the microphone and streams PCM16 chunks to the main process.
3. When recording stops, the main process builds a WAV file from buffered PCM audio.
4. The WAV is sent to Groq's `/audio/transcriptions` API.
5. If enabled, the transcript is sent through a second Groq polish pass.
6. The final text is pasted into the active app.
7. The raw transcript, polished transcript, duration, and captured app context are saved to local history.

## Stack

- Electron 40
- Electron Forge with Vite
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- `electron-store`
- `node-global-key-listener`

## Project Structure

```text
src/
  app/       Main dashboard window (React UI)
  overlay/   Floating recording/transcription overlay
  main/      Electron main-process services and IPC
  shared/    Shared types, constants, defaults, hotkey helpers
assets/      App icons
```

Key modules:

- `src/main.ts`: app bootstrap, tray setup, windows, shortcuts, permission prompt
- `src/main/ipc-handlers.ts`: recording lifecycle, realtime transcription pipeline, history save, overlay updates
- `src/main/realtime-transcription-service.ts`: buffered Groq Whisper transcription request
- `src/main/ai-service.ts`: optional polish call to Groq chat completions
- `src/overlay/components/Overlay.tsx`: live recording UI and microphone capture lifecycle
- `src/app/pages/*`: dashboard, history, dictionary, and settings screens

## Local Data

VoiceFlow stores data under Electron's `app.getPath('userData')`:

- `history/`: one JSON file per transcription
- `dictionary/`: one JSON file per custom vocabulary entry
- Electron config store: hotkeys, API key, language, polish toggle, microphone selection

The Groq API key is currently read from the in-app settings store, not from `.env`.

## Prerequisites

- macOS
- Node.js 18+ recommended
- npm
- A Groq API key

You will also need macOS permissions for:

- Microphone
- Accessibility
- Apple Events / automation

Without Accessibility permission, transcription can still complete, but auto-paste will not work reliably.

## Development

Install dependencies:

```bash
npm install
```

Start the app in development:

```bash
npm start
```

Lint the codebase:

```bash
npm run lint
```

Create packaged output:

```bash
npm run package
```

Build distributables:

```bash
npm run make
```

## First Run

1. Launch the app.
2. Open the VoiceFlow window from the tray if it does not stay visible.
3. Go to Settings.
4. Paste your Groq API key.
5. Choose a microphone if needed.
6. Confirm or change the default shortcuts:
   - Toggle: `` ` ``
   - Hold-to-record: `Shift+Space`
7. Grant Microphone and Accessibility permissions when macOS prompts for them.

## Notes And Limitations

- Despite the `realtime` naming in several files and IPC channels, the current implementation buffers audio locally and submits one transcription request when recording ends.
- The language setting exists in config and is passed to Groq if set, but there is no language picker in the current UI.
- History browsing is implemented, but delete/export controls are minimal in the current renderer.
- There are no automated tests in this repository at the moment.

## License

MIT
