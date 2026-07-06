import {
  BulletList,
  Callout,
  CodeBlock,
  EnvTable,
  FieldTable,
  InfoGrid,
  Pill,
  SchemaDiagram,
  StepList,
} from "@/components/docs/mdx";
import {
  BookIcon,
  CpuIcon,
  DatabaseIcon,
  KeyboardIcon,
  RouteIcon,
  SettingsIcon,
} from "@/components/docs/icons";
import type { DocsGroup } from "../types";

export const referenceGroup: DocsGroup = {
  title: "Reference",
  icon: DatabaseIcon,
  pages: [
    {
      slug: "data-model",
      group: "Reference",
      eyebrow: "Reference",
      title: "Data model & storage",
      description:
        "The exact shape of settings, history records, and dictionary entries — and where each lives on disk. Everything is local JSON.",
      quickFacts: [
        { label: "Config", value: "electron-store JSON" },
        { label: "History", value: "One file per record" },
        { label: "Location", value: "app userData directory" },
      ],
      sections: [
        {
          id: "schema",
          title: "Entities",
          body: (
            <>
              <p>
                VoiceFlow persists three things: your settings (a single config
                object), your transcription history (one JSON file per record),
                and your dictionary (one JSON file per term).
              </p>
              <SchemaDiagram
                caption="app_context is a serialized CursorContext captured at recording time. optimized_text, command_text, and source_text are populated depending on mode."
                tables={[
                  {
                    name: "AppSettings",
                    icon: SettingsIcon,
                    summary: "Single config object in the electron-store.",
                    columns: [
                      { name: "hotkey", type: "string", badges: ["index"] },
                      { name: "holdToTranscribeHotkey", type: "string" },
                      { name: "language", type: "string" },
                      { name: "enablePolish", type: "boolean" },
                      { name: "polishProvider", type: '"groq"' },
                      { name: "audioInputDeviceId", type: "string", optional: true },
                      { name: "groqApiKey", type: "string" },
                      { name: "defaultMode", type: "dictation|ask", badges: ["owner"] },
                      { name: "askPasteBehavior", type: "enum" },
                    ],
                  },
                  {
                    name: "TranscriptionRecord",
                    icon: DatabaseIcon,
                    summary: "One JSON file per transcription, named <id>.json.",
                    columns: [
                      { name: "id", type: "string", badges: ["pk"] },
                      { name: "mode", type: "dictation|ask", badges: ["owner"] },
                      { name: "original_text", type: "string" },
                      { name: "optimized_text", type: "string", optional: true },
                      { name: "command_text", type: "string", optional: true },
                      { name: "source_text", type: "string", optional: true },
                      { name: "final_text", type: "string" },
                      { name: "app_context", type: "json", optional: true, badges: ["json"] },
                      { name: "detected_language", type: "string", optional: true },
                      { name: "app_name", type: "string", optional: true, badges: ["index"] },
                      { name: "window_title", type: "string", optional: true, badges: ["index"] },
                      { name: "diagnostics", type: "json", optional: true, badges: ["json"] },
                      { name: "duration_seconds", type: "number", optional: true },
                      { name: "word_count", type: "number" },
                      { name: "created_at", type: "string" },
                    ],
                  },
                  {
                    name: "DictionaryWord",
                    icon: BookIcon,
                    summary: "One JSON file per custom vocabulary term.",
                    columns: [
                      { name: "id", type: "string", badges: ["pk"] },
                      { name: "word", type: "string", badges: ["index"] },
                      { name: "created_at", type: "string" },
                    ],
                  },
                ]}
                relations={[
                  {
                    from: "TranscriptionRecord",
                    to: "AppSettings.defaultMode",
                    cardinality: "N : 1",
                    label: "mode chosen at record time",
                  },
                  {
                    from: "DictionaryWord",
                    to: "TranscriptionRecord",
                    cardinality: "N : N",
                    label: "biases the Whisper prompt",
                    soft: true,
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "mode-fields",
          title: "Which text fields are set, by mode",
          body: (
            <FieldTable
              columns={["Field", "Dictation", "Ask"]}
              rows={[
                {
                  name: "original_text",
                  type: "always",
                  description: "The raw Whisper transcript in both modes.",
                },
                {
                  name: "optimized_text",
                  type: "if polished",
                  description:
                    "Dictation: the polished rewrite (or null on fallback). Ask: the transformed text.",
                },
                {
                  name: "command_text",
                  type: "null / instruction",
                  description:
                    "Ask only: the spoken instruction (the raw transcript).",
                },
                {
                  name: "source_text",
                  type: "null / selection",
                  description:
                    "Ask only: the selected text that was transformed.",
                },
                {
                  name: "final_text",
                  type: "always",
                  description: "What was actually pasted — the source of truth.",
                },
              ]}
            />
          ),
        },
        {
          id: "locations",
          title: "Storage locations",
          body: (
            <>
              <p>
                Everything lives under Electron&apos;s{" "}
                <Pill>app.getPath(&apos;userData&apos;)</Pill> directory:
              </p>
              <CodeBlock language="text" title="userData layout">{`<userData>/
├── config.json          # electron-store: settings + API key
├── history/
│   ├── <id>.json        # one TranscriptionRecord per file
│   └── …
└── dictionary/
    ├── <id>.json        # one DictionaryWord per file
    └── …`}</CodeBlock>
              <Callout type="note" title="Custom history directory">
                The history folder can be relocated (for example into a synced
                directory). VoiceFlow will create the target if needed and read /
                write future records there.
              </Callout>
              <Callout type="warning" title="Your API key is stored in plaintext">
                The Groq API key lives in the local config store as plain text,
                readable by anything running as your user. Treat the config
                directory accordingly.
              </Callout>
            </>
          ),
        },
      ],
    },
    {
      slug: "ipc-channels",
      group: "Reference",
      eyebrow: "Reference",
      title: "IPC channels",
      description:
        "The complete catalog of channels between the renderers and the main process, and the typed bridge that wraps them.",
      quickFacts: [
        { label: "Definition", value: "shared/constants.ts" },
        { label: "Bridge", value: "window.electronAPI" },
        { label: "Isolation", value: "contextBridge preload" },
      ],
      sections: [
        {
          id: "bridge",
          title: "The typed bridge",
          body: (
            <>
              <p>
                The preload script exposes one object,{" "}
                <Pill>window.electronAPI</Pill>, typed by the{" "}
                <Pill>ElectronAPI</Pill> interface. Event subscriptions return a
                disposer function so renderers can clean up listeners.
              </p>
              <CodeBlock language="ts" title="subscription pattern">{`// returns () => void to unsubscribe
const dispose = window.electronAPI.onStatusUpdate((status) => {
  // "idle" | "recording" | "transcribing" | "done" | "error"
});
dispose();`}</CodeBlock>
            </>
          ),
        },
        {
          id: "recording",
          title: "Recording & realtime",
          body: (
            <FieldTable
              columns={["Channel", "Direction", "Purpose"]}
              rows={[
                {
                  name: "realtime:start",
                  type: "invoke",
                  description: "Acquire a transcription session before capturing.",
                },
                {
                  name: "realtime:audio-chunk",
                  type: "send",
                  description: "Stream a 100 ms PCM16 chunk to the main-process buffer.",
                },
                {
                  name: "realtime:stop",
                  type: "send",
                  description: "Flush the buffer, transcribe, process, paste, save.",
                },
                {
                  name: "realtime:abort",
                  type: "send",
                  description: "Cancel the in-flight recording and return to idle.",
                },
                {
                  name: "realtime:utterance",
                  type: "push",
                  description: "A recognized transcript segment, pushed to the overlay.",
                },
                {
                  name: "recording:start / stop",
                  type: "push",
                  description: "Main tells the overlay to begin / end microphone capture.",
                },
                {
                  name: "status:update",
                  type: "push",
                  description: "Broadcast the app status to windows and the tray.",
                },
              ]}
            />
          ),
        },
        {
          id: "results",
          title: "Results & settings",
          body: (
            <FieldTable
              columns={["Channel", "Direction", "Purpose"]}
              rows={[
                {
                  name: "transcription:result",
                  type: "push",
                  description: "The final pasted text, sent to the overlay.",
                },
                {
                  name: "transcription:error",
                  type: "push",
                  description: "A user-facing error string (e.g. no speech detected).",
                },
                {
                  name: "settings:get",
                  type: "invoke",
                  description: "Read the current settings object.",
                },
                {
                  name: "settings:set",
                  type: "send",
                  description: "Merge a partial settings update (validated for hotkeys).",
                },
                {
                  name: "settings:updated",
                  type: "push",
                  description: "Broadcast settings changes to all windows.",
                },
                {
                  name: "hotkey:set",
                  type: "invoke",
                  description: "Update the toggle or hold shortcut, with validation.",
                },
                {
                  name: "shortcut:editing",
                  type: "invoke",
                  description: "Pause / resume the native listener while editing a shortcut.",
                },
              ]}
            />
          ),
        },
        {
          id: "history-dict",
          title: "History, stats & dictionary",
          body: (
            <FieldTable
              columns={["Channel", "Direction", "Purpose"]}
              rows={[
                {
                  name: "history:list / get",
                  type: "invoke",
                  description: "Paginated, filterable list; or a single record by id.",
                },
                {
                  name: "history:delete",
                  type: "invoke",
                  description: "Delete a record and its file.",
                },
                {
                  name: "history:reinject",
                  type: "invoke",
                  description: "Re-paste a saved result into the current app.",
                },
                {
                  name: "history:export-one / export-all",
                  type: "invoke",
                  description: "Export a record or the whole history to JSON or Markdown.",
                },
                {
                  name: "history:get-dir / set-dir",
                  type: "invoke",
                  description: "Read or relocate the history directory.",
                },
                {
                  name: "history:updated",
                  type: "push",
                  description: "Tell the dashboard to refresh after a change.",
                },
                {
                  name: "stats:get",
                  type: "invoke",
                  description: "Aggregate word count, record count, and duration.",
                },
                {
                  name: "dictionary:list / add / delete",
                  type: "invoke",
                  description: "Manage custom vocabulary terms.",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "configuration",
      group: "Reference",
      eyebrow: "Reference",
      title: "Configuration",
      description:
        "Every setting VoiceFlow stores, what it controls, and its default value.",
      quickFacts: [
        { label: "Defaults", value: "shared/app-defaults.ts" },
        { label: "Store", value: "electron-store" },
        { label: "Secrets", value: "In-app, not .env" },
      ],
      sections: [
        {
          id: "settings",
          title: "Settings & defaults",
          body: (
            <EnvTable
              rows={[
                {
                  name: "hotkey",
                  purpose: "Toggle shortcut — tap to start, tap to stop.",
                  default: "` (backtick)",
                },
                {
                  name: "holdToTranscribeHotkey",
                  purpose: "Hold-to-talk shortcut — records while held.",
                  default: "Shift+Space",
                },
                {
                  name: "language",
                  purpose: "Whisper language hint; empty means auto-detect.",
                  default: "en",
                },
                {
                  name: "enablePolish",
                  purpose: "Rewrite dictation transcripts into clean text.",
                  default: "true",
                },
                {
                  name: "polishProvider",
                  purpose: "AI provider used for polish and Ask.",
                  default: "groq",
                },
                {
                  name: "audioInputDeviceId",
                  purpose: "Microphone device id; empty means system default.",
                  default: '"" (default)',
                },
                {
                  name: "groqApiKey",
                  purpose: "Your Groq key for transcription and AI calls.",
                  default: '"" (unset)',
                },
                {
                  name: "defaultMode",
                  purpose: "Which mode a new recording uses.",
                  default: "dictation",
                },
                {
                  name: "askPasteBehavior",
                  purpose: "Whether Ask replaces the selection or inserts after it.",
                  default: "replace-selection",
                },
              ]}
            />
          ),
        },
        {
          id: "key-note",
          title: "The API key",
          body: (
            <Callout type="note" title="Read from settings, not .env">
              VoiceFlow reads the Groq API key from the in-app settings store, not
              from an environment file. Add it on the Settings screen. It is used
              for both the Whisper transcription request and the polish / Ask chat
              completions.
            </Callout>
          ),
        },
        {
          id: "models",
          title: "Models & endpoints",
          body: (
            <FieldTable
              columns={["Purpose", "Model", "Endpoint"]}
              rows={[
                {
                  name: "Transcription",
                  type: "whisper-large-v3",
                  description: "POST /openai/v1/audio/transcriptions",
                },
                {
                  name: "Polish",
                  type: "openai/gpt-oss-120b",
                  description: "POST /openai/v1/chat/completions",
                },
                {
                  name: "Ask transform",
                  type: "openai/gpt-oss-120b",
                  description: "POST /openai/v1/chat/completions",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "build-and-release",
      group: "Reference",
      eyebrow: "Reference",
      title: "Build & release",
      description:
        "How VoiceFlow is compiled and packaged — Electron Forge with Vite for the app, Cargo for the native listener, and a GitHub Action for signed DMG releases.",
      quickFacts: [
        { label: "Bundler", value: "Electron Forge + Vite" },
        { label: "Native", value: "Cargo release build" },
        { label: "Output", value: "DMG + ZIP (darwin)" },
      ],
      sections: [
        {
          id: "toolchain",
          title: "Toolchain",
          body: (
            <InfoGrid
              columns={2}
              items={[
                {
                  icon: CpuIcon,
                  title: "Electron Forge + Vite",
                  description:
                    "The Forge Vite plugin builds four bundles: main, preload, and two renderers (main_window and overlay_window).",
                },
                {
                  icon: KeyboardIcon,
                  title: "Cargo",
                  description:
                    "The Rust key listener is compiled to a release binary for the target triple and copied into resources/binaries.",
                },
                {
                  icon: RouteIcon,
                  title: "TypeScript",
                  description:
                    "Typecheck with tsc --noEmit; the CI runs this before building distributables.",
                },
                {
                  icon: DatabaseIcon,
                  title: "Makers",
                  description:
                    "maker-zip and maker-dmg (ULFO format) produce the darwin artifacts.",
                },
              ]}
            />
          ),
        },
        {
          id: "scripts",
          title: "Build scripts",
          body: (
            <>
              <CodeBlock language="bash" title="package.json scripts">{`npm start      # build native listener, then electron-forge start
npm run package  # build native listener, then forge package
npm run make     # build native listener, then forge make (DMG + ZIP)
npm run lint
npm run typecheck`}</CodeBlock>
              <p className="mt-4">
                Every run first invokes{" "}
                <Pill>build:native:key-listener</Pill>, which shells out to
                Cargo:
              </p>
              <CodeBlock language="bash" title="native build (per platform)">{`cargo build --release \\
  --manifest-path native/global-key-listener/Cargo.toml \\
  --target aarch64-apple-darwin        # or x86_64-* / windows

# then the compiled binary is copied to resources/binaries/`}</CodeBlock>
              <Callout type="note" title="TARGET_ARCH">
                Set <Pill>TARGET_ARCH=arm64</Pill> (or <Pill>x64</Pill>) to build
                the native binary for a specific macOS architecture; it defaults
                to the host arch.
              </Callout>
            </>
          ),
        },
        {
          id: "packaging",
          title: "Packaging",
          body: (
            <BulletList
              items={[
                <>
                  <Pill>asar: true</Pill> packs the app; the native binary and{" "}
                  <Pill>assets</Pill> ship as <Pill>extraResource</Pill> so
                  they&apos;re reachable at runtime.
                </>,
                <>
                  In a packaged build the listener is resolved from{" "}
                  <Pill>process.resourcesPath/binaries</Pill>; in dev it&apos;s
                  read from the Cargo <Pill>target</Pill> directory.
                </>,
                <>
                  The worklet and other renderer assets are bundled by Vite; the
                  audio worklet in particular is inlined to survive asar
                  packaging.
                </>,
              ]}
            />
          ),
        },
        {
          id: "release",
          title: "Release automation",
          body: (
            <>
              <p>
                A GitHub Action builds and publishes the DMG when a{" "}
                <Pill>v*</Pill> tag is pushed (or on manual dispatch):
              </p>
              <StepList
                items={[
                  {
                    title: "Set up Node & Rust",
                    description:
                      "Node 20 with npm cache, plus the aarch64-apple-darwin Rust target on a macOS runner.",
                  },
                  {
                    title: "Install & typecheck",
                    description: "npm ci, then npm run typecheck as a gate.",
                  },
                  {
                    title: "Build the native binary & make",
                    description:
                      "Build the key listener, then electron-forge make --arch=arm64.",
                  },
                  {
                    title: "Publish the DMG",
                    description:
                      "The produced .dmg from out/make is attached to the GitHub release.",
                  },
                ]}
              />
              <Callout type="tip">
                The landing page&apos;s Download button points at the latest
                release&apos;s <Pill>VoiceFlow.dmg</Pill>, so tagging a release is
                all it takes to ship an update to users.
              </Callout>
            </>
          ),
        },
      ],
    },
  ],
};
