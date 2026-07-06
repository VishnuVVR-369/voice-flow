import {
  BulletList,
  Callout,
  CardGrid,
  Diagram,
  FlowChain,
  InfoGrid,
  KeyCombo,
  Pill,
  StepList,
} from "@/components/docs/mdx";
import {
  BookIcon,
  BoltIcon,
  CpuIcon,
  DatabaseIcon,
  KeyboardIcon,
  MicIcon,
  RocketIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/docs/icons";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";
import type { DocsGroup } from "../types";

export const getStartedGroup: DocsGroup = {
  title: "Get started",
  icon: RocketIcon,
  pages: [
    {
      slug: "overview",
      group: "Get started",
      eyebrow: "Introduction",
      title: "VoiceFlow documentation",
      description:
        "VoiceFlow is a macOS tray app that turns speech into clean, formatted text and pastes it into whatever app you are already using. Hold a key, talk, and the polished result lands at your cursor.",
      quickFacts: [
        { label: "Platform", value: "macOS 13+ · Apple silicon" },
        { label: "Transcription", value: "Groq · whisper-large-v3" },
        { label: "Storage", value: "100% local JSON" },
      ],
      highlights: [
        {
          title: "Install & grant permissions",
          description:
            "Download the DMG, add your Groq API key, and grant Microphone + Accessibility access.",
          href: "/docs/installation",
        },
        {
          title: "Understand the pipeline",
          description:
            "Follow audio from the microphone through transcription, AI polish, and auto-paste.",
          href: "/docs/architecture",
        },
      ],
      sections: [
        {
          id: "what-it-is",
          title: "What VoiceFlow is",
          body: (
            <>
              <p>
                VoiceFlow is an{" "}
                <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                  open-source
                </a>{" "}
                Electron app that lives in the macOS menu bar. Press a shortcut
                from anywhere, speak, and a floating overlay shows that
                you&apos;re recording. When you stop, the audio is transcribed by
                Groq&apos;s hosted Whisper model, optionally rewritten into clean
                written text by a language model, and pasted straight into the
                app you were already in.
              </p>
              <p className="mt-4">
                There is no VoiceFlow account and no VoiceFlow server. Your
                transcript history, custom dictionary, and settings live in plain
                files on your Mac. The only network calls go directly from your
                machine to the Groq API using the key you provide.
              </p>
              <Callout type="note" title="This documentation follows the code">
                Everything here is written against the current source. Where the
                app&apos;s behavior differs from older READMEs or file names (for
                example the &ldquo;realtime&rdquo; modules that actually buffer
                audio), this documentation describes what the code does today.
              </Callout>
            </>
          ),
        },
        {
          id: "capabilities",
          title: "Core capabilities",
          body: (
            <InfoGrid
              columns={2}
              items={[
                {
                  icon: MicIcon,
                  title: "Speak into any app",
                  description:
                    "Capture happens in a floating overlay and the result is pasted into the previously focused app via macOS Accessibility automation.",
                },
                {
                  icon: SparklesIcon,
                  title: "AI polish",
                  description:
                    "Raw speech is optionally rewritten into structured, filler-free text — questions stay questions, lists become numbered lists.",
                },
                {
                  icon: BoltIcon,
                  title: "Ask mode",
                  description:
                    "Select text anywhere, speak an instruction, and VoiceFlow transforms the selection instead of dictating new text.",
                },
                {
                  icon: KeyboardIcon,
                  title: "Global shortcuts",
                  description:
                    "A native Rust key listener drives toggle and hold-to-talk shortcuts that work while you are in other apps.",
                },
                {
                  icon: BookIcon,
                  title: "Custom dictionary",
                  description:
                    "Add proper nouns and jargon so the transcriber prefers the right spelling for names and technical terms.",
                },
                {
                  icon: ShieldIcon,
                  title: "Local history",
                  description:
                    "Every transcription is saved as a JSON file you can browse, search, re-paste, export, or delete.",
                },
              ]}
            />
          ),
        },
        {
          id: "two-modes",
          title: "Two ways to use your voice",
          body: (
            <>
              <p>
                Every recording runs in one of two modes. The active mode is
                fixed at the moment recording starts, based on your{" "}
                <Pill>defaultMode</Pill> setting.
              </p>
              <BulletList
                items={[
                  <>
                    <strong className="text-stone-200">Dictation</strong> — your
                    speech becomes text. With polish enabled it is rewritten into
                    clean written form, then pasted at the cursor. This is the
                    default mode.
                  </>,
                  <>
                    <strong className="text-stone-200">Ask</strong> — you select
                    text first, then speak an instruction (&ldquo;make this more
                    formal&rdquo;, &ldquo;translate to French&rdquo;). VoiceFlow
                    sends the selection plus your instruction to a language model
                    and replaces the selection with the result.
                  </>,
                ]}
              />
              <Callout type="tip">
                Ask mode needs selected text to work on. If nothing is selected,
                VoiceFlow reports that Ask mode requires a selection.
              </Callout>
            </>
          ),
        },
        {
          id: "pipeline",
          title: "How the pipeline works",
          body: (
            <>
              <p>
                From keypress to pasted text, a dictation runs through this
                sequence. Audio is buffered locally during recording and sent in
                a single request when you stop.
              </p>
              <Diagram caption="End-to-end dictation flow. Ask mode swaps the polish step for a text-transformation call against your selection.">
                <FlowChain
                  nodes={[
                    { label: "Shortcut", sub: "native key listener", tone: "amber", icon: KeyboardIcon },
                    { label: "Capture", sub: "AudioWorklet → PCM16", icon: MicIcon },
                    { label: "Transcribe", sub: "Groq Whisper", tone: "sky", icon: CpuIcon },
                    { label: "Polish", sub: "gpt-oss-120b", tone: "violet", icon: SparklesIcon },
                    { label: "Paste", sub: "osascript ⌘V", tone: "emerald", icon: BoltIcon },
                    { label: "History", sub: "local JSON", icon: DatabaseIcon },
                  ]}
                />
              </Diagram>
            </>
          ),
        },
        {
          id: "next",
          title: "Where to go next",
          body: (
            <CardGrid
              columns={2}
              items={[
                {
                  icon: RocketIcon,
                  title: "Installation",
                  description:
                    "Download the app, grant permissions, and add your Groq API key.",
                  href: "/docs/installation",
                },
                {
                  icon: BookIcon,
                  title: "Dictation & Ask modes",
                  description:
                    "Learn the day-to-day workflow for both recording modes.",
                  href: "/docs/dictation-mode",
                },
                {
                  icon: CpuIcon,
                  title: "Architecture",
                  description:
                    "How the main process, overlay, renderer, and native listener fit together.",
                  href: "/docs/architecture",
                },
                {
                  icon: DatabaseIcon,
                  title: "Data model & storage",
                  description:
                    "The exact shape of settings and history records on disk.",
                  href: "/docs/data-model",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "installation",
      group: "Get started",
      eyebrow: "Get started",
      title: "Installation & permissions",
      description:
        "Download VoiceFlow, grant the macOS permissions it needs to listen and paste, and add your Groq API key.",
      quickFacts: [
        { label: "OS", value: "macOS 13 Ventura or newer" },
        { label: "Chip", value: "Apple silicon (arm64)" },
        { label: "You provide", value: "A Groq API key" },
      ],
      sections: [
        {
          id: "requirements",
          title: "Requirements",
          body: (
            <BulletList
              items={[
                <>A Mac running macOS 13+ on Apple silicon.</>,
                <>
                  A <strong className="text-stone-200">Groq API key</strong> —
                  create one for free at{" "}
                  <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                    console.groq.com
                  </a>
                  . It is stored locally and used for both transcription and
                  polish.
                </>,
                <>
                  A working microphone. VoiceFlow captures mono audio and
                  downsamples it to 16&nbsp;kHz before sending.
                </>,
              ]}
            />
          ),
        },
        {
          id: "download",
          title: "Download & open",
          body: (
            <>
              <StepList
                items={[
                  {
                    title: "Download the DMG",
                    description: (
                      <>
                        Grab the latest{" "}
                        <a href={DOWNLOAD_URL}>VoiceFlow.dmg</a> from the releases
                        page and drag the app into Applications.
                      </>
                    ),
                  },
                  {
                    title: "Open it the first time",
                    description:
                      "Because the build is not notarized, macOS may warn on first open. Right-click the app and choose Open, or allow it under System Settings → Privacy & Security.",
                  },
                  {
                    title: "Find it in the menu bar",
                    description:
                      "VoiceFlow runs as a tray app. The dashboard window opens on launch; you can reopen it any time from the menu-bar icon.",
                  },
                ]}
              />
              <Callout type="note" title="Prefer to build from source?">
                See <a href="/docs/build-and-release">Build &amp; release</a> for
                the full toolchain — Electron Forge, Vite, and the Rust key
                listener.
              </Callout>
            </>
          ),
        },
        {
          id: "permissions",
          title: "macOS permissions",
          body: (
            <>
              <p>
                VoiceFlow is macOS-first and relies on three system permissions.
                On first launch it checks Accessibility and, if it is missing,
                offers to open System Settings for you.
              </p>
              <InfoGrid
                columns={3}
                items={[
                  {
                    icon: MicIcon,
                    title: "Microphone",
                    description:
                      "Required to record audio. macOS prompts the first time you start a recording.",
                  },
                  {
                    icon: ShieldIcon,
                    title: "Accessibility",
                    description:
                      "Powers the global key listener and the simulated ⌘V paste. Without it, results are only copied, not pasted.",
                  },
                  {
                    icon: SparklesIcon,
                    title: "Automation / Apple Events",
                    description:
                      "Lets VoiceFlow re-activate the target app and read selected text through osascript / JXA.",
                  },
                ]}
              />
              <Callout type="warning" title="Accessibility is the important one">
                Grant it under{" "}
                <Pill>System Settings → Privacy &amp; Security → Accessibility</Pill>
                . In development the permission attaches to the terminal or
                editor that launched the app; in the packaged build it attaches
                to VoiceFlow itself.
              </Callout>
            </>
          ),
        },
        {
          id: "api-key",
          title: "Add your Groq API key",
          body: (
            <StepList
              items={[
                {
                  title: "Open Settings",
                  description:
                    "In the VoiceFlow dashboard window, go to the Settings screen.",
                },
                {
                  title: "Paste your key",
                  description:
                    "Paste the key from console.groq.com. It is written to the local config store and never leaves your machine except in requests to Groq.",
                },
                {
                  title: "Pick a microphone (optional)",
                  description:
                    "Leave it on the system default, or choose a specific input device if you use an external mic.",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "quickstart",
      group: "Get started",
      eyebrow: "Get started",
      title: "Quickstart",
      description:
        "Record your first dictation and your first Ask transformation in under a minute.",
      sections: [
        {
          id: "first-dictation",
          title: "Your first dictation",
          body: (
            <>
              <StepList
                items={[
                  {
                    title: "Focus a text field",
                    description:
                      "Click into any editable field — a note, a chat box, a code editor.",
                  },
                  {
                    title: "Start recording",
                    description: (
                      <>
                        Press and hold the hold-to-talk shortcut{" "}
                        <KeyCombo keys={["⇧", "Space"]} />, or tap the toggle
                        shortcut <KeyCombo keys={["`"]} /> to start and tap again
                        to stop. The overlay appears near the bottom of your
                        screen.
                      </>
                    ),
                  },
                  {
                    title: "Speak, then stop",
                    description:
                      "Talk naturally. Release the hold key (or tap toggle again). The overlay switches to a transcribing state.",
                  },
                  {
                    title: "Watch it paste",
                    description:
                      "Within a moment the cleaned-up text is pasted at your cursor and saved to history.",
                  },
                ]}
              />
              <Callout type="tip" title="Hold vs toggle">
                Hold-to-talk is best for quick sentences — recording stops the
                instant you let go. Toggle is best for longer dictation where you
                don&apos;t want to hold a key down.
              </Callout>
            </>
          ),
        },
        {
          id: "first-ask",
          title: "Your first Ask transformation",
          body: (
            <>
              <p>
                Ask mode edits text you already have. Set{" "}
                <Pill>defaultMode</Pill> to <Pill>ask</Pill> in Settings, then:
              </p>
              <StepList
                items={[
                  {
                    title: "Select some text",
                    description:
                      "Highlight a sentence or paragraph in any app.",
                  },
                  {
                    title: "Record an instruction",
                    description:
                      "Trigger a recording and say what to do — for example “rewrite this as three bullet points” or “make it more concise”.",
                  },
                  {
                    title: "Review the replacement",
                    description:
                      "VoiceFlow sends the selection plus your instruction to the model and pastes the transformed text back, replacing the selection by default.",
                  },
                ]}
              />
              <Callout type="note">
                Prefer to keep the original and insert the result after it? Set{" "}
                <Pill>askPasteBehavior</Pill> to <Pill>paste-at-cursor</Pill> —
                VoiceFlow collapses the selection to its end before pasting. See{" "}
                <a href="/docs/ask-mode">Ask mode</a> for details.
              </Callout>
            </>
          ),
        },
        {
          id: "troubleshoot",
          title: "If something doesn't work",
          body: (
            <BulletList
              items={[
                <>
                  <strong className="text-stone-200">Nothing pastes</strong> —
                  Accessibility permission is probably missing. The result is
                  still on your clipboard, so you can paste manually while you fix
                  it.
                </>,
                <>
                  <strong className="text-stone-200">
                    &ldquo;Please configure your Groq API key&rdquo;
                  </strong>{" "}
                  — add a valid key in Settings.
                </>,
                <>
                  <strong className="text-stone-200">&ldquo;No speech detected&rdquo;</strong>{" "}
                  — the microphone captured nothing. Check the selected input
                  device and that the mic isn&apos;t muted.
                </>,
                <>
                  <strong className="text-stone-200">Shortcut does nothing</strong>{" "}
                  — confirm the shortcut isn&apos;t reserved by the system and
                  that the key listener has Accessibility access.
                </>,
              ]}
            />
          ),
        },
      ],
    },
  ],
};
