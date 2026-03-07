#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.m4a', '.webm']);

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

function isAudioFile(fileName) {
  return AUDIO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataDir = path.resolve(String(args.data || 'eval-data'));
  const strict = Boolean(args.strict);

  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    console.error(`[doctor] Data directory not found: ${dataDir}`);
    console.error('[doctor] Create it or pass --data <dir>.');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).sort((a, b) => a.localeCompare(b));
  const audioFiles = files.filter(isAudioFile);
  const txtFiles = new Set(files.filter((name) => path.extname(name).toLowerCase() === '.txt'));

  const report = {
    dataDir,
    audioCount: audioFiles.length,
    pairedCount: 0,
    missingReference: [],
    emptyReference: [],
    orphanText: [],
  };

  for (const audioName of audioFiles) {
    const base = audioName.slice(0, audioName.length - path.extname(audioName).length);
    const txtName = `${base}.txt`;
    const txtPath = path.join(dataDir, txtName);
    if (!fs.existsSync(txtPath)) {
      report.missingReference.push(audioName);
      continue;
    }
    txtFiles.delete(txtName);
    const content = fs.readFileSync(txtPath, 'utf8').trim();
    if (!content) {
      report.emptyReference.push(txtName);
      continue;
    }
    report.pairedCount += 1;
  }

  report.orphanText = Array.from(txtFiles).sort((a, b) => a.localeCompare(b));

  console.log(`[doctor] Data dir: ${report.dataDir}`);
  console.log(`[doctor] Audio files: ${report.audioCount}`);
  console.log(`[doctor] Valid pairs (audio + non-empty txt): ${report.pairedCount}`);

  if (report.missingReference.length) {
    console.log('\n[doctor] Missing transcript (.txt) for:');
    for (const file of report.missingReference) {
      console.log(`  - ${file}`);
    }
  }
  if (report.emptyReference.length) {
    console.log('\n[doctor] Empty transcript files:');
    for (const file of report.emptyReference) {
      console.log(`  - ${file}`);
    }
  }
  if (report.orphanText.length) {
    console.log('\n[doctor] Orphan transcript files (no matching audio):');
    for (const file of report.orphanText) {
      console.log(`  - ${file}`);
    }
  }

  const hasIssues = report.pairedCount === 0
    || report.missingReference.length > 0
    || report.emptyReference.length > 0;

  if (hasIssues) {
    console.log('\n[doctor] Fix dataset issues before running eval:stt.');
    if (strict) {
      process.exit(2);
    }
  } else {
    console.log('\n[doctor] Dataset looks good. Run:');
    console.log(`  GROQ_API_KEY=... npm run eval:stt -- --data "${report.dataDir}"`);
  }
}

main();
