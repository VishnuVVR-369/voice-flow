import {
  Accordion,
  BulletList,
  Callout,
  FieldTable,
  FlowChain,
  Diagram,
  InfoGrid,
  KeyCombo,
  Pill,
  StepList,
} from "@/components/docs/mdx";
import {
  BookIcon,
  BoltIcon,
  ClipboardIcon,
  DatabaseIcon,
  KeyboardIcon,
  MicIcon,
  RouteIcon,
  SparklesIcon,
} from "@/components/docs/icons";
import type { DocsGroup } from "../types";

export const usingVoiceFlowGroup: DocsGroup = {
  title: "Using VoiceFlow",
  icon: BookIcon,
  pages: [
    {
      slug: "dictation-mode",
      group: "Using VoiceFlow",
      eyebrow: "Using VoiceFlow",
      title: "Dictation mode",
      description:
        "Speak and get clean written text pasted at your cursor. Dictation is the default mode and the one you'll use most.",
      quickFacts: [
        { label: "Default mode", value: "dictation" },
        { label: "Polish model", value: "openai/gpt-oss-120b" },
        { label: "Polish", value: "On by default" },
      ],
      sections: [
        {
          id: "recording",
          title: "Starting and stopping a recording",
          body: (
            <>
              <p>
                Dictation supports two independent triggers, both driven by the
                native key listener so they fire while you are in other apps:
              </p>
              <InfoGrid
                columns={2}
                items={[
                  {
                    icon: KeyboardIcon,
                    title: "Hold to talk",
                    description: (
                      <>
                        Default <KeyCombo keys={["⇧", "Space"]} />. Recording
                        runs while the keys are held and stops the moment you
                        release them.
                      </>
                    ),
                  },
                  {
                    icon: BoltIcon,
                    title: "Toggle",
                    description: (
                      <>
                        Default <KeyCombo keys={["`"]} />. Tap once to start,
                        tap again to stop — good for longer, hands-free
                        dictation.
                      </>
                    ),
                  },
                ]}
              />
              <Callout type="note">
                When recording starts, the overlay repositions to the bottom
                center of the display under your cursor and floats above every
                app. When it stops, it shows a transcribing state, then the
                result, then fades back to idle.
              </Callout>
            </>
          ),
        },
        {
          id: "polish",
          title: "What AI polish does",
          body: (
            <>
              <p>
                With <Pill>enablePolish</Pill> on (the default), the raw
                transcript is sent to a language model that rewrites it as clean
                written text. The rewriter is instructed to act as a{" "}
                <em>rewriter, not an assistant</em>: it never answers questions
                in your speech, never translates, and keeps roughly the same
                length as what you said.
              </p>
              <BulletList
                items={[
                  <>Filler words, false starts, and repetitions are removed.</>,
                  <>
                    Speech with multiple points is restructured into a numbered
                    list; a single thought stays as prose.
                  </>,
                  <>
                    The original language is preserved exactly — including
                    code-switching between languages mid-sentence.
                  </>,
                  <>
                    App and window context (and any selected text) are passed as
                    hints so technical terms and variable names survive.
                  </>,
                ]}
              />
              <Callout type="tip" title="Polish always fails safe">
                If the polish call errors, returns nothing, or produces output
                more than 4× longer than the input, VoiceFlow discards it and
                pastes the raw transcript instead. You never lose your words to a
                bad rewrite.
              </Callout>
            </>
          ),
        },
        {
          id: "flow",
          title: "The dictation flow",
          body: (
            <Diagram caption="Dictation pipeline. The polish step is skipped entirely when enablePolish is off, pasting the raw transcript.">
              <FlowChain
                nodes={[
                  { label: "Record", sub: "buffer PCM16", tone: "amber", icon: MicIcon },
                  { label: "Transcribe", sub: "Whisper, 2-pass", tone: "sky", icon: RouteIcon },
                  { label: "Polish", sub: "rewrite to clean text", tone: "violet", icon: SparklesIcon },
                  { label: "Inject", sub: "clipboard + ⌘V", tone: "emerald", icon: ClipboardIcon },
                  { label: "Save", sub: "history JSON", icon: DatabaseIcon },
                ]}
              />
            </Diagram>
          ),
        },
        {
          id: "faq",
          title: "Common questions",
          body: (
            <Accordion
              items={[
                {
                  question: "Can I turn polish off?",
                  answer:
                    "Yes. Disable it in Settings and VoiceFlow pastes the raw Whisper transcript. This is faster and useful when you want a verbatim record.",
                },
                {
                  question: "Does it work in every app?",
                  answer:
                    "Paste uses a simulated ⌘V into the previously focused app, so it works anywhere a normal paste works. Apps that block programmatic paste are the exception.",
                },
                {
                  question: "What happens to my clipboard?",
                  answer:
                    "VoiceFlow saves your existing clipboard, writes the result, pastes, then restores your original clipboard content about half a second later.",
                },
                {
                  question: "Is there a length limit?",
                  answer:
                    "Polish skips text longer than 50,000 characters and falls back to the raw transcript. Practical dictations are far below that.",
                },
              ]}
            />
          ),
        },
      ],
    },
    {
      slug: "ask-mode",
      group: "Using VoiceFlow",
      eyebrow: "Using VoiceFlow",
      title: "Ask mode",
      description:
        "Select text, speak an instruction, and let a language model transform the selection in place — rewrite, summarize, translate, reformat.",
      quickFacts: [
        { label: "Model", value: "openai/gpt-oss-120b" },
        { label: "Requires", value: "A text selection" },
        { label: "Default paste", value: "replace-selection" },
      ],
      sections: [
        {
          id: "how",
          title: "How Ask mode works",
          body: (
            <>
              <p>
                In Ask mode your voice is an <em>instruction</em>, not content.
                When recording starts, VoiceFlow captures the frontmost
                app&apos;s selected text. Your spoken instruction is transcribed
                the same way as dictation, then both are sent to the model, which
                returns only the transformed text.
              </p>
              <Diagram caption="Ask pipeline. The captured selection becomes the source text; your transcribed speech becomes the instruction.">
                <FlowChain
                  nodes={[
                    { label: "Capture selection", sub: "JXA / Accessibility", tone: "amber" },
                    { label: "Transcribe speech", sub: "→ instruction", tone: "sky" },
                    { label: "Transform", sub: "gpt-oss-120b", tone: "violet", icon: SparklesIcon },
                    { label: "Paste result", sub: "replace or insert", tone: "emerald", icon: ClipboardIcon },
                  ]}
                />
              </Diagram>
              <Callout type="warning" title="A selection is required">
                If no text is selected when recording ends, Ask mode reports that
                it needs a selection and nothing is pasted. The instruction is
                also required — silence produces no transform.
              </Callout>
            </>
          ),
        },
        {
          id: "paste-behavior",
          title: "Paste behavior",
          body: (
            <>
              <p>
                The <Pill>askPasteBehavior</Pill> setting controls where the
                result goes:
              </p>
              <FieldTable
                columns={["Value", "Behavior", "Under the hood"]}
                rows={[
                  {
                    name: "replace-selection",
                    type: "default",
                    description:
                      "Pastes over the current selection, replacing it with the transformed text.",
                  },
                  {
                    name: "paste-at-cursor",
                    type: "insert",
                    description:
                      "Collapses the selection to its end (a simulated Right-arrow) before pasting, so the original text is kept and the result is inserted after it.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "prompt-safety",
          title: "Instruction isolation",
          body: (
            <>
              <p>
                The model is told explicitly that the selected text is source
                material, never a prompt. It applies only your spoken
                instruction, preserves factual meaning unless you ask otherwise,
                and returns just the transformed text — no commentary, quotes, or
                code fences.
              </p>
              <BulletList
                items={[
                  <>&ldquo;Make this more formal&rdquo; → a polished rewrite.</>,
                  <>&ldquo;Turn this into three bullet points&rdquo; → a reformatted list.</>,
                  <>&ldquo;Translate to Spanish&rdquo; → a translation of the selection.</>,
                  <>&ldquo;Fix the grammar&rdquo; → a corrected version, same meaning.</>,
                ]}
              />
            </>
          ),
        },
      ],
    },
    {
      slug: "shortcuts",
      group: "Using VoiceFlow",
      eyebrow: "Using VoiceFlow",
      title: "Shortcuts",
      description:
        "Configure the two global shortcuts that drive recording, and understand the rules VoiceFlow enforces on them.",
      quickFacts: [
        { label: "Toggle default", value: "` (backtick)" },
        { label: "Hold default", value: "Shift + Space" },
        { label: "Max keys", value: "5 per shortcut" },
      ],
      sections: [
        {
          id: "two-shortcuts",
          title: "Two shortcuts, two behaviors",
          body: (
            <>
              <InfoGrid
                columns={2}
                items={[
                  {
                    icon: BoltIcon,
                    title: "Toggle shortcut",
                    description:
                      "Press once to start recording, press again to stop. Debounced by 250 ms so a quick double-tap won't cancel itself.",
                  },
                  {
                    icon: KeyboardIcon,
                    title: "Hold-to-talk shortcut",
                    description:
                      "Records only while held. Releasing any key in the combo stops recording immediately.",
                  },
                ]}
              />
              <p className="mt-4">
                Both are matched <em>exactly</em>: the pressed keys must equal the
                shortcut&apos;s keys with nothing extra held down, so the toggle
                and hold shortcuts never fire at the same time.
              </p>
            </>
          ),
        },
        {
          id: "customizing",
          title: "Customizing a shortcut",
          body: (
            <>
              <p>
                Record a new combo in Settings. While you are editing, the global
                listener is paused so your keypresses don&apos;t trigger a
                recording. VoiceFlow validates the combo before saving it.
              </p>
              <StepList
                items={[
                  {
                    title: "Open the shortcut editor",
                    description:
                      "In Settings, focus the toggle or hold shortcut field.",
                  },
                  {
                    title: "Press your combo",
                    description:
                      "Modifiers are ordered consistently (⌘ ⌃ ⌥ ⇧ Fn) and normalized for storage.",
                  },
                  {
                    title: "Save",
                    description:
                      "If the combo is valid and available, it registers immediately with the native listener.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "rules",
          title: "Validation rules",
          body: (
            <>
              <BulletList
                items={[
                  <>At least one key, and at most five keys per shortcut.</>,
                  <>
                    At least one non-modifier key — except a single{" "}
                    <Pill>Fn</Pill>, which is allowed on its own.
                  </>,
                  <>
                    The two shortcuts must differ from each other. If they ever
                    collide, the hold shortcut is reset to a safe fallback on
                    launch.
                  </>,
                  <>
                    Reserved system combos are rejected:{" "}
                    <Pill>⌘Q</Pill>, <Pill>⌘W</Pill>, and <Pill>⌘Tab</Pill>.
                  </>,
                ]}
              />
              <Callout type="note" title="Left/right keys are treated the same">
                The listener expands each shortcut into raw key variants, so a
                shortcut using <Pill>Control</Pill> matches either the left or
                right Control key.
              </Callout>
            </>
          ),
        },
      ],
    },
    {
      slug: "dictionary",
      group: "Using VoiceFlow",
      eyebrow: "Using VoiceFlow",
      title: "Custom dictionary",
      description:
        "Teach the transcriber the proper nouns and jargon you use, so names and technical terms come out spelled correctly.",
      quickFacts: [
        { label: "Storage", value: "One JSON file per word" },
        { label: "Sent to Whisper", value: "Up to 100 terms" },
        { label: "Scope", value: "Transcription prompt only" },
      ],
      sections: [
        {
          id: "why",
          title: "Why a dictionary helps",
          body: (
            <>
              <p>
                Whisper transcribes phonetically and will guess at unfamiliar
                names. Dictionary terms are folded into the transcription
                prompt as preferred spellings, nudging the model toward the right
                form for proper nouns and domain vocabulary — product names,
                people, libraries, acronyms.
              </p>
              <Callout type="note">
                Terms are a hint, not a hard filter. The prompt asks the model to
                prefer these spellings <em>when they match the speech</em>; it
                won&apos;t force a term onto audio that doesn&apos;t contain it.
              </Callout>
            </>
          ),
        },
        {
          id: "managing",
          title: "Adding and removing terms",
          body: (
            <BulletList
              items={[
                <>
                  Add a word or short phrase from the Dictionary screen. Each
                  entry is saved as its own JSON file with an id and timestamp.
                </>,
                <>Duplicate entries are detected and skipped.</>,
                <>Delete a term at any time; it stops influencing new recordings.</>,
                <>
                  The first 100 non-empty terms are included in the transcription
                  prompt for each recording.
                </>,
              ]}
            />
          ),
        },
        {
          id: "hallucination",
          title: "The hallucination guard",
          body: (
            <>
              <p>
                A known failure mode of prompt-based biasing is that the model
                echoes your dictionary terms even when you didn&apos;t say them.
                VoiceFlow watches for this: if a short transcript is made up
                almost entirely of dictionary tokens, it is flagged as a likely
                hallucination in the logs. The two-pass transcription strategy
                also penalizes dictionary-heavy output when scoring candidates.
              </p>
              <Callout type="tip">
                Keep the dictionary focused on terms you actually use often.
                A smaller, high-signal list biases better than a giant one.
              </Callout>
            </>
          ),
        },
      ],
    },
    {
      slug: "history",
      group: "Using VoiceFlow",
      eyebrow: "Using VoiceFlow",
      title: "History & stats",
      description:
        "Every transcription is saved locally as JSON. Browse, search, re-paste, export, and see aggregate stats — all on your machine.",
      quickFacts: [
        { label: "Format", value: "One JSON file per record" },
        { label: "Location", value: "userData/history/" },
        { label: "Export", value: "JSON or Markdown" },
      ],
      sections: [
        {
          id: "browsing",
          title: "Browsing history",
          body: (
            <>
              <p>
                The History screen lists records newest-first, paginated. You can
                search across the final text, original transcript, app name, and
                window title, and filter by mode (all, dictation, or ask).
              </p>
              <BulletList
                items={[
                  <>
                    <strong className="text-stone-200">Search</strong> matches a
                    substring across the record&apos;s text and captured app
                    context.
                  </>,
                  <>
                    <strong className="text-stone-200">Filter</strong> narrows to
                    dictation-only or ask-only records.
                  </>,
                  <>
                    Records are cached in memory and re-sorted on each save so the
                    list stays fast.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "actions",
          title: "Re-paste, export, delete",
          body: (
            <InfoGrid
              columns={3}
              items={[
                {
                  icon: ClipboardIcon,
                  title: "Re-inject",
                  description:
                    "Paste a saved result back into the current app, using the same paste behavior as the original mode.",
                },
                {
                  icon: DatabaseIcon,
                  title: "Export",
                  description:
                    "Save a single record or the whole history to disk. Use a .json or .md extension to pick the format.",
                },
                {
                  icon: BookIcon,
                  title: "Delete",
                  description:
                    "Remove a record; its JSON file is deleted from disk and the cache is updated.",
                },
              ]}
            />
          ),
        },
        {
          id: "stats",
          title: "Aggregate stats",
          body: (
            <>
              <p>
                VoiceFlow computes running totals across every history file:
              </p>
              <FieldTable
                columns={["Stat", "Type", "How it's computed"]}
                rows={[
                  {
                    name: "totalWords",
                    type: "number",
                    description:
                      "Sum of per-record word counts. Counting is CJK-aware — each CJK character counts as one word, Latin words split on whitespace.",
                  },
                  {
                    name: "totalCount",
                    type: "number",
                    description: "Number of saved transcriptions.",
                  },
                  {
                    name: "totalDurationSeconds",
                    type: "number",
                    description:
                      "Sum of recording durations, measured from recording start to stop.",
                  },
                ]}
              />
            </>
          ),
        },
        {
          id: "location",
          title: "Where it lives",
          body: (
            <>
              <p>
                History files are stored under Electron&apos;s{" "}
                <Pill>userData</Pill> directory in a <Pill>history/</Pill>{" "}
                folder. You can point VoiceFlow at a different directory (for
                example a synced folder) and it will move future reads and writes
                there. For the exact record shape, see{" "}
                <a href="/docs/data-model">Data model</a>.
              </p>
            </>
          ),
        },
      ],
    },
  ],
};
