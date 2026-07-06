import {
  BulletList,
  Callout,
  CodeBlock,
  Diagram,
  FieldTable,
  FlowChain,
  InfoGrid,
  LaneSequence,
  Pill,
  ProcessMap,
  ScoreBar,
  StepList,
} from "@/components/docs/mdx";
import {
  BoltIcon,
  ClipboardIcon,
  CpuIcon,
  DatabaseIcon,
  KeyboardIcon,
  MicIcon,
  RouteIcon,
  SparklesIcon,
} from "@/components/docs/icons";
import type { DocsGroup } from "../types";

export const architectureGroup: DocsGroup = {
  title: "Architecture",
  icon: CpuIcon,
  pages: [
    {
      slug: "architecture",
      group: "Architecture",
      eyebrow: "Architecture",
      title: "System architecture",
      description:
        "VoiceFlow is an Electron app split across a main process, two renderer windows, and a native key-listener process. Here's how the pieces fit together.",
      quickFacts: [
        { label: "Runtime", value: "Electron 40 · React 19" },
        { label: "Processes", value: "Main + 2 renderers + native" },
        { label: "IPC", value: "contextBridge preload" },
      ],
      sections: [
        {
          id: "processes",
          title: "The four moving parts",
          body: (
            <>
              <p>
                Like every Electron app, VoiceFlow has a privileged main process
                and sandboxed renderers. It adds a fourth piece: a standalone
                Rust binary that listens for global keystrokes. Each has a
                distinct job.
              </p>
              <Diagram caption="Process layout. The preload bridge exposes a typed window.electronAPI to both renderers; the native listener speaks JSON over stdio.">
                <ProcessMap
                  columns={[
                    {
                      title: "Main process",
                      subtitle: "src/main.ts + src/main/*",
                      tone: "amber",
                      icon: CpuIcon,
                      items: [
                        "ipc-handlers",
                        "transcription-service",
                        "ai / ask-service",
                        "text-injector",
                        "shortcut-manager",
                        "config-store",
                        "history / dictionary",
                      ],
                    },
                    {
                      title: "Overlay window",
                      subtitle: "src/overlay/*",
                      tone: "sky",
                      icon: MicIcon,
                      items: [
                        "recording UI",
                        "pcm-audio-recorder",
                        "waveform animation",
                        "sound effects",
                        "app-store (zustand)",
                      ],
                    },
                    {
                      title: "Dashboard window",
                      subtitle: "src/app/*",
                      tone: "violet",
                      icon: RouteIcon,
                      items: [
                        "Dashboard page",
                        "History page",
                        "Dictionary page",
                        "Settings page",
                        "hotkey editor",
                      ],
                    },
                    {
                      title: "Native listener",
                      subtitle: "native/global-key-listener",
                      tone: "emerald",
                      icon: KeyboardIcon,
                      items: [
                        "Rust + rdev grab",
                        "JSON over stdio",
                        "hotkey matching",
                        "event blocking",
                        "10s heartbeat",
                      ],
                    },
                  ]}
                />
              </Diagram>
            </>
          ),
        },
        {
          id: "windows",
          title: "Windows & the tray",
          body: (
            <>
              <p>
                VoiceFlow is a tray-first app — closing the dashboard doesn&apos;t
                quit it. Two windows exist at all times:
              </p>
              <InfoGrid
                columns={2}
                items={[
                  {
                    icon: MicIcon,
                    title: "The overlay",
                    description:
                      "A frameless, transparent, always-on-top panel anchored to the bottom center of the active display. It's click-through when idle and hosts the microphone capture.",
                  },
                  {
                    icon: RouteIcon,
                    title: "The dashboard",
                    description:
                      "The normal app window with the Dashboard, History, Dictionary, and Settings screens. Reopened from the tray menu.",
                  },
                ]}
              />
              <Callout type="note" title="Why capture lives in the overlay">
                Microphone access needs a renderer with a DOM and the Web Audio
                API. The overlay is always present and visually tied to
                recording, so it owns the <Pill>AudioWorklet</Pill> capture and
                streams PCM chunks to the main process.
              </Callout>
            </>
          ),
        },
        {
          id: "ipc",
          title: "The IPC bridge",
          body: (
            <>
              <p>
                Renderers never touch Node directly. A preload script uses{" "}
                <Pill>contextBridge</Pill> to expose a single typed{" "}
                <Pill>window.electronAPI</Pill> object, and every channel name is
                a constant shared across processes. Calls fall into three shapes:
              </p>
              <FieldTable
                columns={["Pattern", "Direction", "Example"]}
                rows={[
                  {
                    name: "invoke / handle",
                    type: "request → reply",
                    description:
                      "Renderer asks the main process for data and awaits a result — settings:get, history:list, hotkey:set.",
                  },
                  {
                    name: "send / on",
                    type: "renderer → main",
                    description:
                      "Fire-and-forget events — realtime:audio-chunk, realtime:stop, settings:set.",
                  },
                  {
                    name: "webContents.send",
                    type: "main → renderer",
                    description:
                      "Push updates to a window — status:update, transcription:result, history:updated.",
                  },
                ]}
              />
              <p className="mt-4">
                The full catalog is in the{" "}
                <a href="/docs/ipc-channels">IPC channels reference</a>.
              </p>
            </>
          ),
        },
        {
          id: "startup",
          title: "What happens on launch",
          body: (
            <StepList
              items={[
                {
                  title: "Load config & reconcile shortcuts",
                  description:
                    "The config store is read; if the toggle and hold shortcuts collide, the hold shortcut is reset to a safe fallback.",
                },
                {
                  title: "Create the overlay and register IPC",
                  description:
                    "The overlay window is created and positioned, and all IPC handlers are registered.",
                },
                {
                  title: "Start the native key listener",
                  description:
                    "The Rust binary is spawned and the two shortcuts are registered with it.",
                },
                {
                  title: "Create the tray & check permissions",
                  description:
                    "The tray menu is built, and on macOS the app checks Accessibility — offering to open System Settings if it's missing.",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "capture-pipeline",
      group: "Architecture",
      eyebrow: "Architecture",
      title: "Audio capture pipeline",
      description:
        "How raw microphone audio becomes a 16 kHz PCM16 WAV file ready for transcription — inside an AudioWorklet, streamed over IPC, and buffered in the main process.",
      quickFacts: [
        { label: "Target rate", value: "16 kHz mono" },
        { label: "Chunk size", value: "1600 samples · 100 ms" },
        { label: "Sample format", value: "Int16 (PCM16)" },
      ],
      sections: [
        {
          id: "worklet",
          title: "Capture in an AudioWorklet",
          body: (
            <>
              <p>
                The overlay opens the microphone with{" "}
                <Pill>getUserMedia</Pill> (mono, with echo cancellation, noise
                suppression, and auto-gain), then routes it through a Web Audio
                graph into a custom <Pill>AudioWorkletProcessor</Pill> that runs
                on the audio thread.
              </p>
              <Diagram caption="The Web Audio graph. A muted sink keeps the graph pulling audio without any audible loopback.">
                <FlowChain
                  nodes={[
                    { label: "getUserMedia", sub: "~48 kHz mono", tone: "amber", icon: MicIcon },
                    { label: "GainNode", sub: "unity gain" },
                    { label: "AudioWorklet", sub: "resample + quantize", tone: "sky", icon: CpuIcon },
                    { label: "postMessage", sub: "Int16 chunks" },
                    { label: "muted sink", sub: "keeps graph alive", tone: "emerald" },
                  ]}
                />
              </Diagram>
              <Callout type="note" title="Why the worklet code is inlined">
                The processor is registered from an inline blob URL rather than a
                separate file. Loading a worklet module by file path breaks inside
                an asar-packaged Electron build, so the code ships as a string and
                is turned into a Blob at runtime.
              </Callout>
            </>
          ),
        },
        {
          id: "resample",
          title: "Resampling & quantization",
          body: (
            <>
              <p>
                The hardware captures at roughly 48 kHz, but Whisper wants 16 kHz.
                The worklet linearly interpolates samples down to the target rate,
                clamps each to [-1, 1], and quantizes to signed 16-bit. Samples
                accumulate into a 1600-sample buffer — 100 ms of audio — which is
                posted to the main thread whenever it fills.
              </p>
              <FieldTable
                columns={["Parameter", "Value", "Notes"]}
                rows={[
                  {
                    name: "TARGET_SAMPLE_RATE",
                    type: "16000",
                    description: "Whisper's expected input rate.",
                  },
                  {
                    name: "CHUNK_SIZE",
                    type: "1600",
                    description: "Samples per chunk — exactly 100 ms at 16 kHz.",
                  },
                  {
                    name: "ratio",
                    type: "sampleRate / 16000",
                    description:
                      "Decimation ratio; the read position advances by this each output sample.",
                  },
                  {
                    name: "encoding",
                    type: "Int16LE",
                    description:
                      "Negative samples scaled by 0x8000, positive by 0x7FFF.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "buffering",
          title: "Streaming & buffering",
          body: (
            <>
              <p>
                Each 100 ms chunk is sent to the main process over the{" "}
                <Pill>realtime:audio-chunk</Pill> channel. Despite the
                &ldquo;realtime&rdquo; naming, the main process simply{" "}
                <em>buffers</em> these chunks in an array — nothing is sent to
                Groq until you stop.
              </p>
              <Callout type="warning" title="Naming vs behavior">
                Several modules and IPC channels are named{" "}
                <Pill>realtime</Pill> for historical reasons (they once wrapped a
                streaming websocket). The current implementation buffers locally
                and issues a single transcription request on stop. This
                documentation describes the buffering behavior, which is what
                actually runs.
              </Callout>
            </>
          ),
        },
        {
          id: "wav",
          title: "Building the WAV on stop",
          body: (
            <>
              <p>
                When recording stops, all buffered chunks are concatenated and a
                44-byte WAV header is prepended to produce a standard mono PCM16
                WAV in memory. Recording duration is derived directly from the
                byte length:
              </p>
              <CodeBlock language="ts" title="duration from PCM byte length">{`const durationSec = mergedPcm.length / 2 / 16000;
// 2 bytes per Int16 sample, 16000 samples per second`}</CodeBlock>
              <p className="mt-4">
                That WAV is what gets uploaded to Groq. Continue to{" "}
                <a href="/docs/transcription">Transcription</a> for what happens
                next.
              </p>
            </>
          ),
        },
      ],
    },
    {
      slug: "transcription",
      group: "Architecture",
      eyebrow: "Architecture",
      title: "Transcription strategy",
      description:
        "VoiceFlow uses an accuracy-first, two-pass Whisper strategy: transcribe, score the result, and only re-run with different settings when quality looks poor.",
      quickFacts: [
        { label: "Model", value: "whisper-large-v3" },
        { label: "Strategy", value: "v2_accuracy_first" },
        { label: "Re-run threshold", value: "score < 0.70" },
      ],
      sections: [
        {
          id: "request",
          title: "The transcription request",
          body: (
            <>
              <p>
                The WAV is posted as multipart form data to Groq&apos;s
                OpenAI-compatible endpoint, authenticated with your API key.
              </p>
              <CodeBlock language="http" title="POST /openai/v1/audio/transcriptions">{`file:            recording.wav        (audio/wav)
model:           whisper-large-v3
response_format: verbose_json
temperature:     0
language:        en                   (or omitted for auto-detect)
prompt:          dictionary spellings + "transcribe exactly"`}</CodeBlock>
              <p className="mt-4">
                <Pill>verbose_json</Pill> returns the text plus a detected
                language and per-segment data, which feeds the quality scoring
                below.
              </p>
            </>
          ),
        },
        {
          id: "two-pass",
          title: "Two-pass accuracy strategy",
          body: (
            <>
              <p>
                A first pass (<strong className="text-stone-200">Pass A</strong>)
                runs at temperature 0 with the dictionary-biased prompt. Its
                output is scored. Only if the score falls below{" "}
                <Pill>0.70</Pill> does a second pass (
                <strong className="text-stone-200">Pass B</strong>) run with a
                neutral prompt and a small temperature bump, giving the model a
                different shot at ambiguous audio. The higher-scoring pass wins;
                ties break toward the longer transcript.
              </p>
              <Diagram caption="Pass B is conditional — clean audio is transcribed once. The winner is chosen by score, then by length on ties.">
                <FlowChain
                  nodes={[
                    { label: "Pass A", sub: "dictionary · temp 0", tone: "amber" },
                    { label: "Score A", sub: "quality heuristics", tone: "sky" },
                    { label: "score < 0.70?", sub: "else keep A" },
                    { label: "Pass B", sub: "neutral · temp 0.2", tone: "violet" },
                    { label: "Pick winner", sub: "higher score", tone: "emerald" },
                  ]}
                />
              </Diagram>
            </>
          ),
        },
        {
          id: "scoring",
          title: "Quality scoring",
          body: (
            <>
              <p>
                Each candidate starts at a score of <Pill>1.0</Pill> and loses
                points against heuristics that catch common Whisper failure
                modes — runaway repetition, implausible speaking rates, and
                dictionary echoing. The remaining score decides whether Pass B
                runs and which pass is kept.
              </p>
              <ScoreBar
                caption="Penalties are subtracted from a starting score of 1.0, then clamped to [0, 1]. A recording that trips several checks drops below the 0.70 re-run threshold."
                rows={[
                  { label: "Too few tokens", value: 0.35, display: "−0.35" },
                  { label: "Low words/sec", value: 0.25, display: "−0.25" },
                  { label: "High repetition", value: 0.25, display: "−0.25" },
                  { label: "Dictionary-heavy", value: 0.25, display: "−0.25" },
                  { label: "Very high words/sec", value: 0.2, display: "−0.20" },
                  { label: "Long repeat run", value: 0.2, display: "−0.20" },
                ]}
              />
              <FieldTable
                columns={["Check", "Triggers when", "Catches"]}
                rows={[
                  {
                    name: "few-tokens",
                    type: "≤1 token, >2.5s",
                    description: "Long audio that transcribed to almost nothing.",
                  },
                  {
                    name: "words-per-second",
                    type: "<0.45 or >6",
                    description:
                      "Implausibly slow or fast output relative to duration.",
                  },
                  {
                    name: "repetition-ratio",
                    type: ">0.6 unique loss",
                    description:
                      "The same words repeated — a classic Whisper loop.",
                  },
                  {
                    name: "repeat-run",
                    type: "≥4 in a row",
                    description: "A single token stuttered many times.",
                  },
                  {
                    name: "dictionary-ratio",
                    type: "≥0.85 dict tokens",
                    description:
                      "Output that is mostly dictionary terms — likely prompt echo.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "diagnostics",
          title: "Diagnostics",
          body: (
            <>
              <p>
                The chosen pass, both scores, and their reasons are attached to
                the result as <Pill>diagnostics</Pill> and saved with the history
                record. They&apos;re also logged, so you can see why a particular
                transcription was re-run or rejected.
              </p>
              <Callout type="tip">
                Diagnostics are how the two-pass strategy stays debuggable — each
                record remembers which strategy version produced it and how each
                pass scored.
              </Callout>
            </>
          ),
        },
      ],
    },
    {
      slug: "text-and-ai",
      group: "Architecture",
      eyebrow: "Architecture",
      title: "AI processing & text injection",
      description:
        "After transcription, VoiceFlow optionally reshapes the text with a language model, then pastes it into your app through macOS automation.",
      quickFacts: [
        { label: "Polish / Ask model", value: "openai/gpt-oss-120b" },
        { label: "Paste", value: "clipboard + simulated ⌘V" },
        { label: "Context", value: "captured via JXA" },
      ],
      sections: [
        {
          id: "end-to-end",
          title: "The stop-to-paste sequence",
          body: (
            <>
              <p>
                Stopping a recording kicks off a single async pipeline in the main
                process. The branch between polish and Ask is decided by the mode
                that was active when recording started.
              </p>
              <Diagram caption="The stop handler orchestrates transcription, the mode-specific AI call, injection, and history — measuring each stage.">
                <LaneSequence
                  steps={[
                    {
                      lane: "Overlay",
                      title: "Sends realtime:stop",
                      detail: "Recording ends; the main process flushes the audio buffer.",
                      tone: "sky",
                    },
                    {
                      lane: "Transcribe",
                      title: "Whisper returns the raw text",
                      detail: "Two-pass strategy produces the transcript and diagnostics.",
                      tone: "amber",
                    },
                    {
                      lane: "AI",
                      title: "Polish or transform",
                      detail:
                        "Dictation → polish rewrite; Ask → transform the captured selection using the transcript as the instruction.",
                      tone: "violet",
                    },
                    {
                      lane: "Inject",
                      title: "Paste into the target app",
                      detail: "Clipboard is swapped, the app reactivated, and ⌘V simulated.",
                      tone: "emerald",
                    },
                    {
                      lane: "Persist",
                      title: "Save history + notify UI",
                      detail: "The record is written and history:updated pushed to the dashboard.",
                    },
                  ]}
                />
              </Diagram>
            </>
          ),
        },
        {
          id: "polish",
          title: "Polish (dictation)",
          body: (
            <>
              <p>
                Polish sends the raw transcript to{" "}
                <Pill>openai/gpt-oss-120b</Pill> via Groq&apos;s chat completions
                endpoint with a detailed rewriting system prompt. The transcript
                is wrapped in <Pill>[TRANSCRIPTION]</Pill> tags and the model is
                repeatedly told it&apos;s a rewriter, never an assistant — it must
                not answer or translate.
              </p>
              <BulletList
                items={[
                  <>Temperature 0.2, up to 2000 completion tokens.</>,
                  <>
                    App/window context and any selected text are appended as
                    hints to preserve technical vocabulary.
                  </>,
                  <>
                    Guardrails: empty output, HTTP errors, or output more than 4×
                    the input length all fall back to the raw transcript.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "ask",
          title: "Transform (Ask)",
          body: (
            <>
              <p>
                Ask sends the captured selection and your transcribed instruction
                to the same model with a stricter system prompt: apply only the
                spoken instruction, treat the selection as source material (never
                a prompt), and return only the transformed text.
              </p>
              <CodeBlock language="text" title="Ask user message shape">{`APP: <app name>
WINDOW: <window title>
ELEMENT_ROLE: <ax role>

[SPOKEN_INSTRUCTION]
<your transcribed instruction>
[/SPOKEN_INSTRUCTION]

[SELECTED_TEXT]
<the text you had highlighted>
[/SELECTED_TEXT]`}</CodeBlock>
            </>
          ),
        },
        {
          id: "context",
          title: "Context capture",
          body: (
            <>
              <p>
                The moment recording starts, VoiceFlow captures the frontmost
                app&apos;s context by running a JXA script through{" "}
                <Pill>osascript -l JavaScript</Pill>. This reads the app name,
                window title, focused element role, and — crucially for Ask mode
                — the selected text via the Accessibility API. It&apos;s bounded
                by a 500 ms timeout and caps selected text at 1000 characters.
              </p>
              <FieldTable
                columns={["Field", "Source", "Used for"]}
                rows={[
                  {
                    name: "appName",
                    type: "AXApplication",
                    description: "Re-activating the target app before paste.",
                  },
                  {
                    name: "windowTitle",
                    type: "front window",
                    description: "A hint for polish and Ask prompts.",
                  },
                  {
                    name: "selectedText",
                    type: "AXSelectedText",
                    description: "The source text Ask mode transforms.",
                  },
                  {
                    name: "elementRole",
                    type: "AXRole",
                    description: "Formatting-intent hint for Ask.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "injection",
          title: "Text injection",
          body: (
            <>
              <p>
                Pasting is done by writing to the clipboard and simulating{" "}
                <Pill>⌘V</Pill> through <Pill>osascript</Pill> and System Events.
                Before pasting, VoiceFlow reactivates the app it captured so the
                text lands where you were, then restores your previous clipboard
                shortly after.
              </p>
              <StepList
                items={[
                  {
                    title: "Guard against duplicates",
                    description:
                      "A 500 ms minimum interval and a 5 s same-text dedup window prevent double-pastes and rapid-fire collisions.",
                  },
                  {
                    title: "Save & set clipboard",
                    description:
                      "The current clipboard is stashed, then the result text is written to it.",
                  },
                  {
                    title: "Reactivate & (optionally) collapse",
                    description:
                      "The target app is activated. For Ask's paste-at-cursor, the selection is collapsed with a simulated Right-arrow first.",
                  },
                  {
                    title: "Paste & restore",
                    description:
                      "⌘V is simulated; ~500 ms later the original clipboard is restored.",
                  },
                ]}
              />
              <Callout type="warning" title="Accessibility required">
                Simulated paste depends on Accessibility permission. Without it
                the text is still on your clipboard, but the automatic ⌘V
                won&apos;t fire.
              </Callout>
            </>
          ),
        },
      ],
    },
    {
      slug: "global-shortcuts",
      group: "Architecture",
      eyebrow: "Architecture",
      title: "Global key listener",
      description:
        "A native Rust process captures keystrokes system-wide, matches them against registered shortcuts, and can block matched keys from reaching other apps.",
      quickFacts: [
        { label: "Language", value: "Rust · rdev grab" },
        { label: "Transport", value: "JSON lines over stdio" },
        { label: "Heartbeat", value: "Every 10 seconds" },
      ],
      sections: [
        {
          id: "why-native",
          title: "Why a native process",
          body: (
            <>
              <p>
                Electron&apos;s <Pill>globalShortcut</Pill> can&apos;t express
                hold-to-talk or reliably block a key from the focused app.
                VoiceFlow instead spawns a small Rust binary that uses{" "}
                <Pill>rdev</Pill>&apos;s <Pill>grab</Pill> API to intercept the
                macOS event stream, giving it press/release granularity and the
                ability to swallow matched keys.
              </p>
              <Callout type="note" title="App Nap prevention">
                On macOS the listener registers a background activity so the OS
                doesn&apos;t throttle it under App Nap — keystroke monitoring has
                to keep running even when the process looks idle.
              </Callout>
            </>
          ),
        },
        {
          id: "protocol",
          title: "The stdio protocol",
          body: (
            <>
              <p>
                The main process&apos;s <Pill>shortcut-manager</Pill> talks to
                the binary with newline-delimited JSON. It writes a{" "}
                <Pill>register_hotkeys</Pill> command listing the key
                combinations to watch; the binary streams back key events and
                periodic heartbeats.
              </p>
              <CodeBlock language="jsonc" title="main → listener (register)">{`{ "command": "register_hotkeys",
  "hotkeys": [ { "keys": ["ShiftLeft", "Space"] },
               { "keys": ["BackQuote"] } ] }`}</CodeBlock>
              <CodeBlock language="jsonc" title="listener → main (events)">{`{ "type": "keydown", "key": "Space", "timestamp": "..." }
{ "type": "keyup",   "key": "Space", "timestamp": "..." }
{ "type": "heartbeat_ping", "id": "7", "timestamp": "..." }`}</CodeBlock>
            </>
          ),
        },
        {
          id: "matching",
          title: "Matching & blocking",
          body: (
            <>
              <p>
                The binary tracks the set of currently-pressed keys. On each press
                it checks whether the pressed set exactly equals any registered
                combo; if so, it returns <Pill>None</Pill> from the grab callback,
                which <em>blocks</em> the key from reaching other apps. The main
                process independently tracks pressed tokens to decide when to
                start and stop recording.
              </p>
              <BulletList
                items={[
                  <>
                    Shortcuts are expanded into raw key variants so left/right
                    modifiers both match.
                  </>,
                  <>
                    A special case blocks the Fn key (reported as{" "}
                    <Pill>Unknown(179)</Pill>) when an Fn shortcut is registered.
                  </>,
                  <>
                    Matching requires an exact set — extra held keys mean no
                    match, keeping toggle and hold from overlapping.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "resilience",
          title: "Resilience",
          body: (
            <>
              <p>
                A key listener that dies or gets stuck would silently break every
                shortcut, so the manager supervises it aggressively.
              </p>
              <InfoGrid
                columns={2}
                items={[
                  {
                    icon: BoltIcon,
                    title: "Heartbeat watchdog",
                    description:
                      "The binary emits a heartbeat every 10 s. If none arrives within 15 s, the manager restarts the process.",
                  },
                  {
                    icon: KeyboardIcon,
                    title: "Stuck-key recovery",
                    description:
                      "Keys held longer than 5 s are cleared (unless part of an active hold recording), so a missed key-up event can't jam a shortcut.",
                  },
                  {
                    icon: ClipboardIcon,
                    title: "Auto-restart",
                    description:
                      "If the process exits unexpectedly, it's respawned after ~1 s and the shortcuts are re-registered.",
                  },
                  {
                    icon: SparklesIcon,
                    title: "Editing pause",
                    description:
                      "While you record a new shortcut in Settings, the listener is disabled so your keypresses don't trigger recording.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "binary-path",
          title: "Where the binary lives",
          body: (
            <p>
              In development the manager runs the Cargo build output for your
              architecture (e.g. <Pill>aarch64-apple-darwin</Pill>). In a packaged
              build it&apos;s bundled as an extra resource under{" "}
              <Pill>resources/binaries</Pill>. See{" "}
              <a href="/docs/build-and-release">Build &amp; release</a> for how
              it&apos;s compiled and packaged.
            </p>
          ),
        },
      ],
    },
  ],
};
