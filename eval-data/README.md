# STT Eval Dataset

Put your local benchmark clips here with matching transcripts.

## Required format

- Supported audio: `.wav`, `.mp3`, `.m4a`, `.webm`
- For each audio file, add a transcript `.txt` with the same basename

Example:

```text
eval-data/
  clip-001.wav
  clip-001.txt
  clip-002.m4a
  clip-002.txt
```

## Transcript rules

- Transcript text should be the exact expected transcription output.
- Use plain UTF-8 text.
- Keep one file per clip (no JSON needed).

## Commands

Validate dataset:

```bash
npm run eval:stt:doctor -- --data eval-data --strict
```

Run A/B evaluation:

```bash
GROQ_API_KEY=your_key npm run eval:stt -- --data eval-data
```

Outputs are written to `out/stt-eval/` (`summary.json`, `per_file.csv`).
