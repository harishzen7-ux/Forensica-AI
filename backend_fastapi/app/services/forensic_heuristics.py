from __future__ import annotations

from dataclasses import dataclass
import math
import re
from typing import List, Tuple


@dataclass
class HeuristicResult:
    authenticity_score: int
    signals: List[str]
    summary: str


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max_value, max(min_value, value))


def _average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _variance(values: List[float]) -> float:
    if len(values) <= 1:
        return 0.0
    mean = _average(values)
    return _average([(value - mean) ** 2 for value in values])


def _shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    frequencies = [0] * 256
    for byte in data:
        frequencies[byte] += 1

    entropy = 0.0
    length = len(data)
    for count in frequencies:
        if count == 0:
            continue
        probability = count / length
        entropy -= probability * math.log2(probability)
    return entropy


def _repeated_block_ratio(data: bytes, block_size: int = 32, sample_size: int = 512) -> float:
    if len(data) < block_size * 2:
        return 0.0
    seen = set()
    duplicates = 0
    total = 0
    offset = 0
    while offset + block_size <= len(data) and total < sample_size:
        block = data[offset : offset + block_size]
        if block in seen:
            duplicates += 1
        else:
            seen.add(block)
        total += 1
        offset += block_size
    return (duplicates / total) if total else 0.0


def _zero_byte_ratio(data: bytes) -> float:
    if not data:
        return 0.0
    return data.count(0) / len(data)


def _ascii_ratio(data: bytes) -> float:
    if not data:
        return 0.0
    ascii_count = 0
    for byte in data:
        if 32 <= byte <= 126 or byte in (9, 10, 13):
            ascii_count += 1
    return ascii_count / len(data)


def _signature_matches_mime(data: bytes, mime_type: str) -> bool:
    if mime_type.startswith("image/jpeg"):
        return len(data) >= 3 and data[0:3] == b"\xff\xd8\xff"
    if mime_type.startswith("image/png"):
        return len(data) >= 8 and data[:8] == bytes([137, 80, 78, 71, 13, 10, 26, 10])
    if mime_type.startswith("image/webp"):
        return len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP"
    if mime_type.startswith("video/mp4"):
        return len(data) >= 8 and data[4:8] == b"ftyp"
    if mime_type.startswith("video/webm"):
        return len(data) >= 4 and data[:4] == bytes([0x1A, 0x45, 0xDF, 0xA3])
    if mime_type.startswith("audio/wav"):
        return len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WAVE"
    if mime_type.startswith("audio/mpeg"):
        return len(data) >= 3 and data[:3] == b"ID3"
    if mime_type.startswith("application/pdf"):
        return len(data) >= 5 and data[:5] == b"%PDF-"
    return True


def _build_summary(label: str, score: int, signals: List[str], metrics: List[Tuple[str, str]]) -> str:
    if signals:
        lead = f"{label} analysis completed with {len(signals)} anomaly signal(s) detected."
        signal_summary = f"Key signals: {'; '.join(signals)}."
    else:
        lead = f"{label} analysis completed with no high-confidence anomaly clusters."
        signal_summary = "Key signals: structural and statistical patterns were within expected thresholds."
    metric_summary = "Metrics: " + ", ".join([f"{k} {v}" for k, v in metrics]) + "."
    return f"{lead} Authenticity score {score}/100. {signal_summary} {metric_summary}"


def binary_heuristics(file_path: str, mime_type: str, modality: str) -> HeuristicResult:
    with open(file_path, "rb") as f:
        data = f.read()

    entropy = _shannon_entropy(data)
    repeated = _repeated_block_ratio(data)
    zeros = _zero_byte_ratio(data)
    ascii_density = _ascii_ratio(data)
    size_kb = len(data) / 1024 if data else 0.0
    mime_ok = _signature_matches_mime(data, mime_type or "")
    signals_with_impact: List[Tuple[str, int]] = []

    def push(condition: bool, label: str, impact: int) -> None:
        if condition:
            signals_with_impact.append((label, impact))

    if modality == "image":
        push(size_kb < 40, "Very small image payload reduces sensor-level evidence.", 14)
        push(entropy < 4.6, "Low byte entropy suggests heavy recompression or templated regions.", 18)
        push(entropy > 7.85, "Extremely high entropy aligns with synthetic noise or aggressive post-processing.", 10)
        push(repeated > 0.08, "Repeated byte blocks indicate duplicated structures.", 16)
        push(zeros > 0.12, "Zero-byte density is higher than expected for normal image exports.", 8)
        base_score = 88
        label = "Image"
    elif modality == "video":
        push(size_kb < 150, "Container is unusually small for a reviewable video sample.", 15)
        push(entropy < 5.2, "Compressed frame stream appears overly regular for natural motion.", 14)
        push(entropy > 7.9, "High-entropy stream suggests re-encoding or generation artifacts.", 10)
        push(repeated > 0.12, "Repeated binary segments may indicate looped frame structures.", 16)
        push(zeros > 0.18, "Padding-heavy container layout lowered confidence.", 7)
        base_score = 78
        label = "Video"
    elif modality == "audio":
        push(size_kb < 24, "Audio payload is short or sparse, limiting organic waveform evidence.", 12)
        push(entropy < 4.2, "Low entropy is consistent with over-processed or normalized audio.", 14)
        push(entropy > 7.7, "Extremely noisy payload can align with synthetic vocoder residue.", 10)
        push(repeated > 0.07, "Repeated blocks suggest looped or generated waveform sections.", 15)
        push(zeros > 0.2, "Silence or zero padding occupies an unusually large share of the clip.", 8)
        base_score = 80
        label = "Audio"
    else:
        push(size_kb < 12, "Text sample is short, reducing author-style confidence.", 10)
        push(entropy < 3.6, "Byte distribution is overly regular for naturally authored text.", 14)
        push(repeated > 0.09, "Repeated structural segments suggest templated generation patterns.", 12)
        push(ascii_density < 0.7, "Character distribution appears noisy for standard language content.", 8)
        base_score = 74
        label = "Text"

    push(not mime_ok and modality != "text", "File signature does not match the declared MIME type.", 22)

    penalty = sum(impact for _, impact in signals_with_impact)
    score = int(_clamp(round(base_score - penalty), 6, 98))
    signals = [label for label, _ in signals_with_impact]
    if not signals:
        signals = ["No dominant anomaly clusters detected."]

    summary = _build_summary(
        label,
        score,
        signals if signals and signals[0] != "No dominant anomaly clusters detected." else [],
        [
            ("size", f"{size_kb:.1f}KB"),
            ("entropy", f"{entropy:.2f}"),
            ("repeat ratio", f"{repeated * 100:.1f}%"),
            ("zero-byte ratio", f"{zeros * 100:.1f}%"),
        ],
    )
    return HeuristicResult(authenticity_score=score, signals=signals, summary=summary)


def text_heuristics(text: str) -> HeuristicResult:
    normalized = re.sub(r"\s+", " ", text or "").strip()
    words = re.findall(r"\b[\w'-]+\b", normalized, flags=re.UNICODE)
    sentences = [part.strip() for part in re.split(r"[.!?]+", normalized) if part.strip()]
    unique_words = {w.lower() for w in words}
    lexical_diversity = (len(unique_words) / len(words)) if words else 0.0
    sentence_lengths = [len(re.findall(r"\b[\w'-]+\b", sentence, flags=re.UNICODE)) for sentence in sentences]
    sentence_variance = _variance([float(v) for v in sentence_lengths])
    punctuation = re.findall(r"[,:;!?-]", normalized)
    punctuation_density = (len(punctuation) / len(normalized)) if normalized else 0.0
    lower_words = [w.lower() for w in words]

    trigram_counts = {}
    for idx in range(0, max(0, len(lower_words) - 2)):
        trigram = " ".join(lower_words[idx : idx + 3])
        trigram_counts[trigram] = trigram_counts.get(trigram, 0) + 1

    repeated_trigrams = sum((count - 1) for count in trigram_counts.values() if count > 1)
    trigram_repeat_ratio = (repeated_trigrams / max(1, len(lower_words) - 2)) if len(lower_words) >= 3 else 0.0
    contractions = re.findall(r"\b\w+'\w+\b", normalized)

    signals_with_impact: List[Tuple[str, int]] = []

    def push(condition: bool, label: str, impact: int) -> None:
        if condition:
            signals_with_impact.append((label, impact))

    push(len(words) < 30, "Short text sample limits authorship confidence.", 8)
    push(len(words) > 80 and lexical_diversity < 0.42, "Low lexical diversity is common in generated prose.", 18)
    push(len(sentences) > 4 and sentence_variance < 9, "Sentence lengths are unusually uniform.", 12)
    push(trigram_repeat_ratio > 0.08, "Repeated phrase windows suggest predictive text assembly.", 20)
    push(punctuation_density < 0.006 or punctuation_density > 0.08, "Punctuation density falls outside expected natural-writing range.", 8)
    push(len(words) > 120 and len(contractions) == 0, "Long-form text lacks informal contractions.", 6)

    human_boost = 5 if len(contractions) >= 2 else 0
    penalty = sum(impact for _, impact in signals_with_impact)
    score = int(_clamp(round(74 - penalty + human_boost), 8, 98))
    signals = [label for label, _ in signals_with_impact]
    if not signals:
        signals = ["Language rhythm and lexical variation appear broadly human-like."]

    summary = _build_summary(
        "Text",
        score,
        signals if signals and not signals[0].startswith("Language rhythm") else [],
        [
            ("word count", str(len(words))),
            ("lexical diversity", f"{lexical_diversity:.2f}"),
            ("sentence variance", f"{sentence_variance:.2f}"),
            ("trigram repetition", f"{trigram_repeat_ratio * 100:.1f}%"),
        ],
    )
    return HeuristicResult(authenticity_score=score, signals=signals, summary=summary)


def score_to_classification(score: int) -> str:
    return "AI-Generated" if score < 55 else "Real"


def score_to_confidence(score: int) -> float:
    margin = abs(score - 55)
    confidence = 0.52 + (margin / 55.0) * 0.43
    return round(_clamp(confidence, 0.50, 0.95), 4)
