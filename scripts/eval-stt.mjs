#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';
const PASS_B_THRESHOLD = 0.7;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.data) {
    printUsage();
    process.exit(1);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY environment variable.');
    process.exit(1);
  }

  const dataDir = path.resolve(args.data);
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    console.error(`Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  const outDir = path.resolve(args.out || 'out/stt-eval');
  fs.mkdirSync(outDir, { recursive: true });

  const dictionaryWords = loadDictionaryWords(args.dictionary);
  const language = typeof args.language === 'string' ? args.language : 'en';
  const audioExt = new Set(['.wav', '.mp3', '.m4a', '.webm']);

  const entries = fs.readdirSync(dataDir)
    .filter((name) => audioExt.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const results = [];
  const skipped = [];

  for (const audioName of entries) {
    const base = audioName.slice(0, audioName.length - path.extname(audioName).length);
    const audioPath = path.join(dataDir, audioName);
    const referencePath = path.join(dataDir, `${base}.txt`);

    if (!fs.existsSync(referencePath)) {
      skipped.push({ file: audioName, reason: 'missing reference txt' });
      continue;
    }

    const referenceText = fs.readFileSync(referencePath, 'utf8').trim();
    if (!referenceText) {
      skipped.push({ file: audioName, reason: 'empty reference txt' });
      continue;
    }

    const audioBuffer = fs.readFileSync(audioPath);
    const mimeType = mimeTypeForExt(path.extname(audioName));
    const startedAt = Date.now();

    const baselineResult = await runSinglePass({
      apiKey,
      audioBuffer,
      fileName: audioName,
      mimeType,
      language,
      promptMode: 'dictionary',
      temperature: 0,
      responseFormat: 'json',
      dictionaryWords,
    });

    const improvedResult = await runImproved({
      apiKey,
      audioBuffer,
      fileName: audioName,
      mimeType,
      language,
      dictionaryWords,
    });

    const baselineMetrics = computeMetrics(referenceText, baselineResult.text);
    const improvedMetrics = computeMetrics(referenceText, improvedResult.text);

    results.push({
      file: audioName,
      durationMs: Date.now() - startedAt,
      referenceText,
      baseline: {
        text: baselineResult.text,
        wer: baselineMetrics.wer,
        cer: baselineMetrics.cer,
      },
      improved: {
        text: improvedResult.text,
        wer: improvedMetrics.wer,
        cer: improvedMetrics.cer,
        selectedPass: improvedResult.selectedPass,
        passA: improvedResult.passA,
        passB: improvedResult.passB,
      },
    });

    console.log(
      `[eval:stt] ${audioName} | baseline WER ${(baselineMetrics.wer * 100).toFixed(2)}% -> improved WER ${(improvedMetrics.wer * 100).toFixed(2)}%`
    );
  }

  if (results.length === 0) {
    console.error('No evaluable files found. Provide audio files with matching .txt references.');
    process.exit(1);
  }

  const baselineAgg = aggregateMetrics(results, 'baseline');
  const improvedAgg = aggregateMetrics(results, 'improved');
  const werImprovementPct = baselineAgg.wer > 0
    ? ((baselineAgg.wer - improvedAgg.wer) / baselineAgg.wer) * 100
    : 0;
  const cerImprovementPct = baselineAgg.cer > 0
    ? ((baselineAgg.cer - improvedAgg.cer) / baselineAgg.cer) * 100
    : 0;

  const summary = {
    dataDir,
    filesEvaluated: results.length,
    filesSkipped: skipped,
    language,
    model: GROQ_WHISPER_MODEL,
    aggregate: {
      baseline: baselineAgg,
      improved: improvedAgg,
      improvements: {
        werRelativePct: Number(werImprovementPct.toFixed(4)),
        cerRelativePct: Number(cerImprovementPct.toFixed(4)),
      },
    },
    files: results.map((r) => ({
      file: r.file,
      baseline_wer: r.baseline.wer,
      improved_wer: r.improved.wer,
      baseline_cer: r.baseline.cer,
      improved_cer: r.improved.cer,
      selected_pass: r.improved.selectedPass,
      pass_a_score: r.improved.passA.score,
      pass_b_score: r.improved.passB?.score ?? null,
      duration_ms: r.durationMs,
    })),
  };

  const summaryPath = path.join(outDir, 'summary.json');
  const csvPath = path.join(outDir, 'per_file.csv');

  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(csvPath, toCsv(results), 'utf8');

  console.log(`\n[eval:stt] Evaluated ${results.length} files`);
  console.log(`[eval:stt] Aggregate WER: baseline ${(baselineAgg.wer * 100).toFixed(2)}% -> improved ${(improvedAgg.wer * 100).toFixed(2)}%`);
  console.log(`[eval:stt] Relative WER improvement: ${werImprovementPct.toFixed(2)}%`);
  console.log(`[eval:stt] Summary: ${summaryPath}`);
  console.log(`[eval:stt] CSV: ${csvPath}`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function printUsage() {
  console.log('Usage: npm run eval:stt -- --data <dir> [--out <dir>] [--language <code>] [--dictionary <file>]');
}

function loadDictionaryWords(filePath) {
  if (!filePath) return [];
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.warn(`[eval:stt] Dictionary file not found: ${abs}`);
    return [];
  }
  return fs.readFileSync(abs, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mimeTypeForExt(ext) {
  const normalized = ext.toLowerCase();
  if (normalized === '.wav') return 'audio/wav';
  if (normalized === '.mp3') return 'audio/mpeg';
  if (normalized === '.m4a') return 'audio/mp4';
  if (normalized === '.webm') return 'audio/webm';
  return 'application/octet-stream';
}

async function runImproved({ apiKey, audioBuffer, fileName, mimeType, language, dictionaryWords }) {
  const passAConfig = {
    promptMode: 'dictionary',
    temperature: 0,
    responseFormat: 'verbose_json',
    language,
  };
  const passA = await runSinglePass({
    apiKey,
    audioBuffer,
    fileName,
    mimeType,
    language,
    promptMode: passAConfig.promptMode,
    temperature: passAConfig.temperature,
    responseFormat: passAConfig.responseFormat,
    dictionaryWords,
  });
  const passAQuality = evaluateQuality(passA.text, null, dictionaryWords);

  let selectedPass = 'A';
  let selected = passA;
  let passB;
  let passBQuality;

  if (passAQuality.score < PASS_B_THRESHOLD) {
    passB = await runSinglePass({
      apiKey,
      audioBuffer,
      fileName,
      mimeType,
      language,
      promptMode: 'neutral',
      temperature: 0.2,
      responseFormat: 'verbose_json',
      dictionaryWords,
    });
    passBQuality = evaluateQuality(passB.text, null, dictionaryWords);
    if (
      passBQuality.score > passAQuality.score
      || (passBQuality.score === passAQuality.score && passB.text.length > passA.text.length)
    ) {
      selectedPass = 'B';
      selected = passB;
    }
  }

  return {
    text: selected.text,
    selectedPass,
    passA: {
      score: passAQuality.score,
      reasons: passAQuality.reasons,
      textLength: passA.text.length,
    },
    passB: passBQuality ? {
      score: passBQuality.score,
      reasons: passBQuality.reasons,
      textLength: passB?.text.length ?? 0,
    } : undefined,
  };
}

async function runSinglePass({
  apiKey,
  audioBuffer,
  fileName,
  mimeType,
  language,
  promptMode,
  temperature,
  responseFormat,
  dictionaryWords,
}) {
  const prompt = buildPrompt(promptMode, dictionaryWords);
  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), fileName);
  form.append('model', GROQ_WHISPER_MODEL);
  form.append('temperature', String(temperature));
  form.append('response_format', responseFormat);

  if (language) {
    form.append('language', language);
  }
  if (prompt) {
    form.append('prompt', prompt);
  }

  const resp = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Transcription failed for ${fileName} (${resp.status}): ${body.slice(0, 400)}`);
  }

  const data = await resp.json();
  return {
    text: (data.text || '').trim(),
    detectedLanguage: data.language,
    segments: Array.isArray(data.segments) ? data.segments : undefined,
  };
}

function buildPrompt(mode, dictionaryWords) {
  const basePrompt = 'Transcribe exactly what was spoken. Do not summarize or translate.';
  if (mode === 'neutral') return basePrompt;
  if (!dictionaryWords || dictionaryWords.length === 0) return basePrompt;
  const cleaned = dictionaryWords
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (cleaned.length === 0) return basePrompt;
  return `${basePrompt} Prefer these spellings for proper nouns/terms when they match speech: ${cleaned.join(', ')}.`;
}

function evaluateQuality(text, durationSec, dictionaryWords) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return {
      score: 0,
      reasons: ['empty transcript'],
    };
  }

  const tokens = normalized
    .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let score = 1;
  const reasons = [];

  if (tokens.length <= 1) {
    score -= 0.35;
    reasons.push('too few tokens');
  }

  if (durationSec && durationSec > 0) {
    const wps = tokens.length / durationSec;
    if (wps < 0.45 && durationSec > 2) {
      score -= 0.25;
      reasons.push('very low words-per-second');
    } else if (wps > 6) {
      score -= 0.2;
      reasons.push('very high words-per-second');
    }
  }

  const uniqueTokenCount = new Set(tokens).size;
  const repeatedTokenRatio = tokens.length > 0 ? 1 - uniqueTokenCount / tokens.length : 0;
  if (tokens.length >= 6 && repeatedTokenRatio > 0.6) {
    score -= 0.25;
    reasons.push('high repetition ratio');
  }

  let maxRun = 1;
  let currentRun = 1;
  for (let i = 1; i < tokens.length; i += 1) {
    if (tokens[i] === tokens[i - 1]) {
      currentRun += 1;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 1;
    }
  }
  if (maxRun >= 4) {
    score -= 0.2;
    reasons.push('long repeated-token run');
  }

  const dictionaryTokenRatio = computeDictionaryTokenRatio(tokens, dictionaryWords);
  if (tokens.length >= 3 && dictionaryTokenRatio >= 0.85) {
    score -= 0.25;
    reasons.push('dictionary-heavy output');
  }

  score = Math.max(0, Math.min(1, score));
  if (reasons.length === 0) reasons.push('quality checks passed');
  return { score, reasons };
}

function computeDictionaryTokenRatio(tokens, dictionaryWords) {
  if (!dictionaryWords || dictionaryWords.length === 0 || tokens.length === 0) return 0;
  const dictTokens = new Set();
  for (const phrase of dictionaryWords) {
    const normalized = phrase
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
    for (const token of normalized) {
      dictTokens.add(token);
    }
  }
  if (dictTokens.size === 0) return 0;
  let hits = 0;
  for (const token of tokens) {
    if (dictTokens.has(token)) hits += 1;
  }
  return hits / tokens.length;
}

function computeMetrics(referenceText, hypothesisText) {
  const refNorm = normalizeForEval(referenceText);
  const hypNorm = normalizeForEval(hypothesisText);

  const refWords = refNorm.length ? refNorm.split(' ') : [];
  const hypWords = hypNorm.length ? hypNorm.split(' ') : [];
  const wordDist = editDistance(refWords, hypWords);
  const wer = refWords.length > 0 ? wordDist / refWords.length : 0;

  const refChars = refNorm.replace(/\s+/g, '');
  const hypChars = hypNorm.replace(/\s+/g, '');
  const charDist = editDistance(refChars.split(''), hypChars.split(''));
  const cer = refChars.length > 0 ? charDist / refChars.length : 0;

  return { wer, cer };
}

function normalizeForEval(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[rows - 1][cols - 1];
}

function aggregateMetrics(results, strategy) {
  const werValues = results.map((r) => r[strategy].wer);
  const cerValues = results.map((r) => r[strategy].cer);
  return {
    wer: Number((werValues.reduce((sum, v) => sum + v, 0) / werValues.length).toFixed(6)),
    cer: Number((cerValues.reduce((sum, v) => sum + v, 0) / cerValues.length).toFixed(6)),
  };
}

function toCsv(results) {
  const header = [
    'file',
    'baseline_wer',
    'improved_wer',
    'baseline_cer',
    'improved_cer',
    'selected_pass',
    'pass_a_score',
    'pass_b_score',
    'duration_ms',
  ];
  const lines = [header.join(',')];

  for (const row of results) {
    lines.push([
      csvEscape(row.file),
      row.baseline.wer.toFixed(6),
      row.improved.wer.toFixed(6),
      row.baseline.cer.toFixed(6),
      row.improved.cer.toFixed(6),
      row.improved.selectedPass,
      row.improved.passA.score.toFixed(4),
      row.improved.passB ? row.improved.passB.score.toFixed(4) : '',
      String(row.durationMs),
    ].join(','));
  }

  return `${lines.join('\n')}\n`;
}

function csvEscape(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
