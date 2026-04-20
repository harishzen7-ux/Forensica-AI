from __future__ import annotations

from typing import Iterable


def _normalize_signs(signs: object) -> list[str]:
    if not isinstance(signs, Iterable) or isinstance(signs, (str, bytes)):
        return []
    return [str(sign).strip() for sign in signs if str(sign).strip()]


def format_ml_detection_result(modality: str, ml_result: dict) -> dict:
    score = float(ml_result.get("score", 50) or 50)
    score = max(0.0, min(100.0, score))

    classification = "Real" if score >= 60.0 else "AI-Generated"
    confidence_pct = score if classification == "Real" else 100.0 - score
    confidence = round(confidence_pct / 100.0, 3)

    signs = _normalize_signs(ml_result.get("signs"))
    summary = str(ml_result.get("summary", "")).strip()

    details: list[str] = []
    if summary:
        details.append(summary)
    if signs:
        details.append(" | ".join(signs[:3]))

    explanation = (
        f"{modality.title()} assessment: {classification} "
        f"({int(round(confidence * 100))}% confidence)."
    )
    if details:
        explanation = f"{explanation} {' '.join(details)}"

    return {
        "classification": classification,
        "confidence": confidence,
        "explanation": explanation,
    }
