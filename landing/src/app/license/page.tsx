import Link from "next/link";
import { Logo } from "@/components/Logo";
import { REPOSITORY_URL } from "@/lib/download";

export const metadata = {
  title: "License — VoiceFlow",
  description: "VoiceFlow is open source under the MIT License.",
};

export default function LicensePage() {
  const year = new Date().getFullYear();

  return (
    <main className="container-x pt-[130px] sm:pt-[150px] pb-[120px]">
      <Link
        href="/"
        className="mb-10 inline-flex items-center transition-transform duration-300 hover:scale-[1.02]"
      >
        <Logo />
      </Link>

      <h1 className="text-[clamp(32px,5vw,48px)] font-semibold tracking-tight text-stone-100">
        License
      </h1>
      <p className="mt-3 mono text-[13px] tracking-[0.05em] uppercase text-stone-500">
        MIT License
      </p>

      <div className="mt-10 max-w-[640px] space-y-5 text-[15px] leading-relaxed text-stone-400">
        <p>Copyright © {year} VoiceFlow contributors.</p>
        <p>
          Permission is hereby granted, free of charge, to any person
          obtaining a copy of this software and associated documentation
          files (the &ldquo;Software&rdquo;), to deal in the Software without
          restriction, including without limitation the rights to use, copy,
          modify, merge, publish, distribute, sublicense, and/or sell copies
          of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </p>
        <p>
          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.
        </p>
        <p>
          THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF
          ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
          NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
          BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
          ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
          CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
          SOFTWARE.
        </p>
        <p>
          The full source code is available on{" "}
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </main>
  );
}
