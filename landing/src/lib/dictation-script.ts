// Scripted dictation phrases for the live-morphing diff.
//
// Each phrase is a sequence of tokens:
//   - keep   — word/phrase stays. `final` is its polished form (capitalization, formatting).
//   - filler — word collapses out during morph (struck through while raw).
//   - insert — appears only in the polished form (punctuation, formal close, etc.).
//
// Tokens render with a trailing space unless `glue: true` (joins to the next token).

export type Token =
  | { kind: "keep"; text: string; final?: string; glue?: boolean }
  | { kind: "filler"; text: string; glue?: boolean }
  | { kind: "insert"; text: string; glue?: boolean };

export type Phrase = {
  id: string;
  context: { app: string; recipient: string };
  tokens: Token[];
  /** Pre-computed polished string for SSR & screen readers. */
  polished: string;
};

const k = (text: string, final?: string, glue?: boolean): Token =>
  final !== undefined
    ? { kind: "keep", text, final, ...(glue ? { glue } : {}) }
    : { kind: "keep", text, ...(glue ? { glue } : {}) };
const f = (text: string, glue?: boolean): Token => ({
  kind: "filler",
  text,
  ...(glue ? { glue } : {}),
});
const ins = (text: string, glue?: boolean): Token => ({
  kind: "insert",
  text,
  ...(glue ? { glue } : {}),
});

const compose = (tokens: Token[]) => {
  let out = "";
  for (const t of tokens) {
    if (t.kind === "filler") continue;
    const text = t.kind === "keep" ? t.final ?? t.text : t.text;
    out += text + (t.glue ? "" : " ");
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
      k("we"),
      k("should"),
      f("like"),
      f("probably"),
      k("ship"),
      k("the"),
      k("auth"),
      k("fix"),
      k("on"),
      k("tuesday", "Tuesday", true),
      ins(".", true),
      f("um"),
      f("and"),
      f("also"),
      ins("Also", true),
      ins(" —", true),
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
      k("friday", "Friday", true),
      ins("?", true),
    ],
  },
  // 2. Standup — list formation, sentence boundaries
  {
    id: "standup",
    context: { app: "Linear", recipient: "Daily standup" },
    tokens: [
      f("ok"),
      f("um"),
      k("yesterday"),
      k("i", "I"),
      k("finished"),
      k("the"),
      k("invoice"),
      k("migration", "migration", true),
      ins(".", true),
      k("today"),
      k("i'm", "I'm"),
      k("picking"),
      k("up"),
      k("the"),
      k("webhook"),
      k("retry"),
      k("bug", "bug", true),
      ins(".", true),
      f("uh"),
      f("and"),
      ins("Blocked", true),
      ins(":", true),
      k("waiting"),
      k("on"),
      k("design"),
      k("for"),
      k("the"),
      k("empty"),
      k("state", "state", true),
      ins(".", true),
    ],
  },
  // 3. Code review — multi-word identifiers polished into backticked code
  {
    id: "pr-review",
    context: { app: "GitHub", recipient: "PR #482" },
    tokens: [
      f("yeah"),
      f("so"),
      k("the"),
      k("issue"),
      k("is"),
      k("we're"),
      k("calling"),
      k("fetch user", "`fetchUser`"),
      k("before"),
      k("the"),
      k("session", "`session`"),
      k("hydrates", "hydrates", true),
      ins(".", true),
      f("like"),
      f("maybe"),
      ins("Maybe", true),
      k("move"),
      k("it"),
      k("into"),
      k("the"),
      k("use effect", "`useEffect`"),
      k("hook", "hook", true),
      ins("?", true),
    ],
  },
  // 4. Email — tightening, em-dash, formal close
  {
    id: "email-reply",
    context: { app: "Mail", recipient: "Re: Q3 review" },
    tokens: [
      f("hey"),
      ins("Hi"),
      k("alex", "Alex", true),
      ins(",", true),
      f("so"),
      f("basically"),
      k("thanks"),
      k("for"),
      k("the"),
      k("notes", "notes", true),
      ins(".", true),
      f("um"),
      k("i", "I"),
      k("agree"),
      f("with"),
      f("all"),
      f("of"),
      f("them"),
      ins(" —", true),
      k("let's"),
      k("ship"),
      k("the"),
      k("changes"),
      k("by"),
      k("friday", "Friday", true),
      ins(".", true),
    ],
  },
];

export const SCRIPT: Phrase[] = phraseTokens.map((p) => ({
  ...p,
  polished: compose(p.tokens),
}));
