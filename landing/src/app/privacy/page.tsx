import Link from "next/link";
import { Logo } from "@/components/Logo";
import { REPOSITORY_URL } from "@/lib/download";

export const metadata = {
  title: "Privacy — VoiceFlow",
  description: "How VoiceFlow handles your audio, transcripts, and data.",
};

export default function PrivacyPage() {
  return (
    <main className="container-x pt-[130px] sm:pt-[150px] pb-[120px]">
      <Link
        href="/"
        className="mb-10 inline-flex items-center transition-transform duration-300 hover:scale-[1.02]"
      >
        <Logo />
      </Link>

      <h1 className="text-[clamp(32px,5vw,48px)] font-semibold tracking-tight text-stone-100">
        Privacy
      </h1>
      <p className="mt-3 mono text-[13px] tracking-[0.05em] uppercase text-stone-500">
        What VoiceFlow stores, and where it sends your audio
      </p>

      <div className="mt-10 max-w-[640px] space-y-8 text-[15px] leading-relaxed text-stone-400">
        <section>
          <h2 className="text-[18px] font-semibold text-stone-100">
            Local storage
          </h2>
          <p className="mt-2">
            Transcript history and custom dictionary entries are stored as
            plain JSON files on your Mac, under Electron&apos;s local user
            data directory. Your API key, hotkeys, microphone selection, and
            other preferences are also stored locally. Nothing is uploaded to
            a VoiceFlow server, because there isn&apos;t one — VoiceFlow has
            no backend of its own.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-stone-100">
            What leaves your machine
          </h2>
          <p className="mt-2">
            When you record, the captured audio is sent directly to Groq to
            be transcribed with Whisper. If you enable AI polish, the raw
            transcript is sent to Groq again for a rewrite pass. These calls
            use the Groq API key you provide in Settings, made directly from
            your machine to Groq&apos;s API.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-stone-100">
            Deleting your data
          </h2>
          <p className="mt-2">
            Since history and dictionary entries are plain JSON files you
            own, you can delete them at any time from the app or directly
            from disk. There is no server-side copy to remove.
          </p>
        </section>

        <section>
          <p>
            VoiceFlow is open source — read the full source on{" "}
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              GitHub
            </a>{" "}
            to verify any of this yourself.
          </p>
        </section>
      </div>
    </main>
  );
}
