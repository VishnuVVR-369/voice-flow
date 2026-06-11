// Scripted dictation phrases for the scroll-linked morphing demo.
//
// Each phrase is a sequence of tokens:
//   - keep   — word/phrase stays. `final` is its polished form (capitalization, formatting).
//   - filler — word collapses out during morph (struck through while raw).
//   - insert — appears only in the polished form (punctuation, formal close, etc.).
//
// Spacing: every token renders with a trailing space. Attaching punctuation
// (". , ? ! : ;") inserts are glued to the previous word at render time, so
// raw and polished views both space correctly.

export type Token =
  | { kind: "keep"; text: string; final?: string }
  | { kind: "filler"; text: string }
  | { kind: "insert"; text: string };

export type Phrase = {
  id: string;
  context: { app: string; recipient: string };
  tokens: Token[];
  /** Pre-computed polished string for SSR & screen readers. */
  polished: string;
};

const k = (text: string, final?: string): Token =>
  final !== undefined ? { kind: "keep", text, final } : { kind: "keep", text };
const f = (text: string): Token => ({ kind: "filler", text });
const ins = (text: string): Token => ({ kind: "insert", text });

const compose = (tokens: Token[]) => {
  let out = "";
  for (const t of tokens) {
    if (t.kind === "filler") continue;
    const text = t.kind === "keep" ? t.final ?? t.text : t.text;
    out += text + " ";
  }
  return out
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
};

const phraseTokens: Omit<Phrase, "polished">[] = [
  // 1. Slack — filler removal + day-name capitalization + em-dash
  {
    id: "auth-fix",
    context: { app: "Slack", recipient: "#eng" },
    tokens: [
      f("uh"),
      f("so"),
      k("we", "We"),
      k("should"),
      f("like"),
      f("probably"),
      k("ship"),
      k("the"),
      k("auth"),
      k("fix"),
      k("on"),
      k("tuesday", "Tuesday"),
      ins("."),
      f("um"),
      f("and"),
      f("also"),
      ins("Also"),
      ins("—"),
      k("can"),
      k("you"),
      k("let"),
      k("the"),
      k("team"),
      k("know"),
      k("about"),
      k("the"),
      k("meeting"),
      k("on"),
      k("friday", "Friday"),
      ins("?"),
    ],
  },
  // 2. Standup — list formation, sentence boundaries
  {
    id: "standup",
    context: { app: "Linear", recipient: "Daily standup" },
    tokens: [
      f("ok"),
      f("um"),
      k("yesterday", "Yesterday"),
      k("i", "I"),
      k("finished"),
      k("the"),
      k("invoice"),
      k("migration"),
      ins("."),
      k("today", "Today"),
      k("i'm", "I'm"),
      k("picking"),
      k("up"),
      k("the"),
      k("webhook"),
      k("retry"),
      k("bug"),
      ins("."),
      f("uh"),
      f("and"),
      ins("Blocked"),
      ins(":"),
      k("waiting"),
      k("on"),
      k("design"),
      k("for"),
      k("the"),
      k("empty"),
      k("state"),
      ins("."),
    ],
  },
  // 3. Code review — multi-word identifiers polished into backticked code
  {
    id: "pr-review",
    context: { app: "GitHub", recipient: "PR #482" },
    tokens: [
      f("yeah"),
      f("so"),
      k("the", "The"),
      k("issue"),
      k("is"),
      k("we're"),
      k("calling"),
      k("fetch user", "`fetchUser`"),
      k("before"),
      k("the"),
      k("session", "`session`"),
      k("hydrates"),
      ins("."),
      f("like"),
      f("maybe"),
      ins("Maybe"),
      k("move"),
      k("it"),
      k("into"),
      k("the"),
      k("use effect", "`useEffect`"),
      k("hook"),
      ins("?"),
    ],
  },
  // 4. Email — tightening, em-dash, formal greeting
  {
    id: "email-reply",
    context: { app: "Mail", recipient: "Re: Q3 review" },
    tokens: [
      f("hey"),
      ins("Hi"),
      k("alex", "Alex"),
      ins(","),
      f("so"),
      f("basically"),
      k("thanks"),
      k("for"),
      k("the"),
      k("notes"),
      ins("."),
      f("um"),
      k("i", "I"),
      k("agree"),
      f("with"),
      f("all"),
      f("of"),
      f("them"),
      ins("—"),
      k("let's"),
      k("ship"),
      k("the"),
      k("changes"),
      k("by"),
      k("friday", "Friday"),
      ins("."),
    ],
  },
];

export const SCRIPT: Phrase[] = phraseTokens.map((p) => ({
  ...p,
  polished: compose(p.tokens),
}));
