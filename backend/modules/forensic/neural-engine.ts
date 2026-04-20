import { ForensicResult } from './types';

type BinaryContent = {
  buffer: Buffer;
  mimeType: string;
};

type SupportedBinaryModality = 'image' | 'video' | 'audio' | 'document';

type Signal = {
  label: string;
  impact: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const variance = (values: number[]) => {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
};

const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

const getRiskLevel = (score: number): ForensicResult['risk_level'] => {
  if (score >= 70) {
    return 'Low';
  }

  if (score >= 40) {
    return 'Medium';
  }

  return 'High';
};

const shannonEntropy = (buffer: Buffer) => {
  if (!buffer.length) {
    return 0;
  }

  const frequencies = new Array<number>(256).fill(0);
  for (const byte of buffer) {
    frequencies[byte] += 1;
  }

  return frequencies.reduce((entropy, count) => {
    if (!count) {
      return entropy;
    }

    const probability = count / buffer.length;
    return entropy - probability * Math.log2(probability);
  }, 0);
};

const repeatedBlockRatio = (buffer: Buffer, blockSize = 32, sampleSize = 512) => {
  if (buffer.length < blockSize * 2) {
    return 0;
  }

  const seen = new Set<string>();
  let duplicates = 0;
  let total = 0;

  for (let offset = 0; offset + blockSize <= buffer.length && total < sampleSize; offset += blockSize) {
    const block = buffer.subarray(offset, offset + blockSize).toString('base64');
    if (seen.has(block)) {
      duplicates += 1;
    } else {
      seen.add(block);
    }
    total += 1;
  }

  return total ? duplicates / total : 0;
};

const zeroByteRatio = (buffer: Buffer) => {
  if (!buffer.length) {
    return 0;
  }

  let zeros = 0;
  for (const byte of buffer) {
    if (byte === 0) {
      zeros += 1;
    }
  }

  return zeros / buffer.length;
};

const asciiRatio = (buffer: Buffer) => {
  if (!buffer.length) {
    return 0;
  }

  let ascii = 0;
  for (const byte of buffer) {
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      ascii += 1;
    }
  }

  return ascii / buffer.length;
};

const signatureMatchesMime = (buffer: Buffer, mimeType: string) => {
  const signatures: Array<{ mimePrefix: string; matches: (data: Buffer) => boolean }> = [
    { mimePrefix: 'image/jpeg', matches: (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
    { mimePrefix: 'image/png', matches: (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
    { mimePrefix: 'image/webp', matches: (data) => data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP' },
    { mimePrefix: 'video/mp4', matches: (data) => data.length >= 12 && data.subarray(4, 8).toString('ascii') === 'ftyp' },
    { mimePrefix: 'video/webm', matches: (data) => data.length >= 4 && data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3 },
    { mimePrefix: 'audio/wav', matches: (data) => data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WAVE' },
    { mimePrefix: 'audio/mpeg', matches: (data) => data.length >= 3 && data.subarray(0, 3).toString('ascii') === 'ID3' },
    { mimePrefix: 'application/pdf', matches: (data) => data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-' },
  ];

  const signature = signatures.find((entry) => mimeType.startsWith(entry.mimePrefix));
  return signature ? signature.matches(buffer) : true;
};

const buildSummary = (
  label: string,
  score: number,
  signals: Signal[],
  metrics: Array<[string, string]>
) => {
  const lead =
    signals.length === 0
      ? `${label} analysis completed with no high-confidence anomaly clusters.`
      : `${label} analysis completed with ${signals.length} anomaly signal${signals.length === 1 ? '' : 's'} identified by the local Neural Engine.`;

  const signalSummary = signals.length
    ? `Key signals: ${signals.map((signal) => signal.label).join('; ')}.`
    : 'Key signals: file structure and statistical patterns remained within expected local thresholds.';

  const metricSummary = `Metrics: ${metrics.map(([name, value]) => `${name} ${value}`).join(', ')}.`;

  return `${lead} Authenticity score ${score}/100. ${signalSummary} ${metricSummary}`;
};

export class NeuralEngine {
  analyzeBinary(modality: SupportedBinaryModality, content: BinaryContent): ForensicResult {
    const entropy = shannonEntropy(content.buffer);
    const repeated = repeatedBlockRatio(content.buffer);
    const zeros = zeroByteRatio(content.buffer);
    const ascii = asciiRatio(content.buffer);
    const sizeKb = content.buffer.length / 1024;
    const mimeOk = signatureMatchesMime(content.buffer, content.mimeType);
    const signals: Signal[] = [];

    const pushSignal = (condition: boolean, label: string, impact: number) => {
      if (condition) {
        signals.push({ label, impact });
      }
    };

    if (modality === 'image') {
      pushSignal(sizeKb < 40, 'Very small image payload reduces confidence in sensor-level evidence.', 14);
      pushSignal(entropy < 4.6, 'Low byte entropy suggests heavy recompression or templated image regions.', 18);
      pushSignal(entropy > 7.85, 'Extremely high entropy is consistent with synthetic noise or aggressive post-processing.', 10);
      pushSignal(repeated > 0.08, 'Repeated byte blocks indicate duplicated structures compatible with cloning or generative fills.', 16);
      pushSignal(zeros > 0.12, 'Zero-byte density is higher than expected for a normal consumer image export.', 8);
    } else if (modality === 'video') {
      pushSignal(sizeKb < 150, 'Container is unusually small for a reviewable video sample.', 15);
      pushSignal(entropy < 5.2, 'Compressed frame stream looks overly regular for natural motion content.', 14);
      pushSignal(entropy > 7.9, 'High-entropy stream suggests re-encoding or synthetic generation artifacts.', 10);
      pushSignal(repeated > 0.12, 'Repeated binary segments may indicate looped or machine-generated frame structures.', 16);
      pushSignal(zeros > 0.18, 'Padding-heavy container layout lowered confidence.', 7);
    } else if (modality === 'audio') {
      pushSignal(sizeKb < 24, 'Audio payload is short or sparse, limiting organic waveform evidence.', 12);
      pushSignal(entropy < 4.2, 'Low entropy is consistent with over-processed or heavily normalized audio.', 14);
      pushSignal(entropy > 7.7, 'Extremely noisy payload can align with synthetic vocoder residue.', 10);
      pushSignal(repeated > 0.07, 'Repeated blocks suggest looped or generated waveform sections.', 15);
      pushSignal(zeros > 0.2, 'Silence or zero padding occupies an unusually large share of the clip.', 8);
    } else {
      pushSignal(sizeKb < 12, 'Document is very small, limiting structural verification depth.', 10);
      pushSignal(entropy < 3.6, 'Document byte distribution is overly regular for a naturally edited file.', 14);
      pushSignal(repeated > 0.09, 'Repeated structural segments suggest templated exports or duplicate object streams.', 12);
      pushSignal(ascii > 0.9 && !content.mimeType.startsWith('text/'), 'Document content is unexpectedly text-heavy for the declared binary format.', 10);
    }

    pushSignal(!mimeOk, 'File signature does not match the declared MIME type.', 22);

    const penalty = signals.reduce((sum, signal) => sum + signal.impact, 0);
    const baseScoreMap: Record<SupportedBinaryModality, number> = {
      image: 88,
      video: 78,
      audio: 80,
      document: 86,
    };

    const score = clamp(Math.round(baseScoreMap[modality] - penalty), 6, 98);

    return {
      authenticity_score: score,
      risk_level: getRiskLevel(score),
      tampering_signs: signals.length ? signals.map((signal) => signal.label) : ['No dominant anomaly clusters were detected by the local Neural Engine.'],
      forensic_summary: buildSummary(
        modality === 'document' ? 'Document' : modality.charAt(0).toUpperCase() + modality.slice(1),
        score,
        signals,
        [
          ['size', `${sizeKb.toFixed(1)}KB`],
          ['entropy', entropy.toFixed(2)],
          ['repeat ratio', `${(repeated * 100).toFixed(1)}%`],
          ['zero-byte ratio', `${(zeros * 100).toFixed(1)}%`],
        ]
      ),
    };
  }

  analyzeText(content: { text: string }): ForensicResult {
    const normalized = normalizeWhitespace(content.text);
    const words = normalized.match(/\b[\p{L}\p{N}'-]+\b/gu) ?? [];
    const sentences = normalized.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
    const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
    const lexicalDiversity = words.length ? uniqueWords.size / words.length : 0;
    const sentenceLengths = sentences.map((sentence) => (sentence.match(/\b[\p{L}\p{N}'-]+\b/gu) ?? []).length);
    const sentenceVariance = variance(sentenceLengths);
    const punctuationMatches = normalized.match(/[,:;!?-]/g) ?? [];
    const punctuationDensity = normalized.length ? punctuationMatches.length / normalized.length : 0;
    const lowerWords = words.map((word) => word.toLowerCase());
    const trigramCounts = new Map<string, number>();

    for (let index = 0; index <= lowerWords.length - 3; index += 1) {
      const trigram = lowerWords.slice(index, index + 3).join(' ');
      trigramCounts.set(trigram, (trigramCounts.get(trigram) ?? 0) + 1);
    }

    const repeatedTrigrams = [...trigramCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
    const trigramRepeatRatio = lowerWords.length >= 3 ? repeatedTrigrams / (lowerWords.length - 2) : 0;
    const contractions = normalized.match(/\b\w+'\w+\b/g) ?? [];
    const signals: Signal[] = [];

    const pushSignal = (condition: boolean, label: string, impact: number) => {
      if (condition) {
        signals.push({ label, impact });
      }
    };

    pushSignal(words.length < 30, 'Short text sample limits authorship confidence.', 8);
    pushSignal(words.length > 80 && lexicalDiversity < 0.42, 'Lexical diversity is low for the sample size, which is common in generated prose.', 18);
    pushSignal(sentences.length > 4 && sentenceVariance < 9, 'Sentence lengths are unusually uniform across the passage.', 12);
    pushSignal(trigramRepeatRatio > 0.08, 'Repeated phrase windows suggest templated or predictive text assembly.', 20);
    pushSignal(punctuationDensity < 0.006 || punctuationDensity > 0.08, 'Punctuation density falls outside the expected range for natural writing.', 8);
    pushSignal(words.length > 120 && contractions.length === 0, 'Long-form text lacks informal contractions, which can indicate machine-styled normalization.', 6);

    const humanBoost = contractions.length >= 2 ? 5 : 0;
    const score = clamp(Math.round(74 - signals.reduce((sum, signal) => sum + signal.impact, 0) + humanBoost), 8, 98);

    return {
      authenticity_score: score,
      risk_level: getRiskLevel(score),
      tampering_signs: signals.length ? signals.map((signal) => signal.label) : ['Language rhythm and lexical variation appear broadly human-like.'],
      forensic_summary: buildSummary('Text', score, signals, [
        ['word count', String(words.length)],
        ['lexical diversity', lexicalDiversity.toFixed(2)],
        ['sentence variance', sentenceVariance.toFixed(2)],
        ['trigram repetition', `${(trigramRepeatRatio * 100).toFixed(1)}%`],
      ]),
    };
  }
}

export const neuralEngine = new NeuralEngine();
