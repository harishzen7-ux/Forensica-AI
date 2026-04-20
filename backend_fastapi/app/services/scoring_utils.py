def clamp_score(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def classify_from_ai_score(ai_score: float) -> str:
    return "AI-Generated" if ai_score >= 55.0 else "Real"


def calibrated_confidence(ai_score: float, signal_count: int, sufficiency: float) -> float:
    """
    Deterministic confidence calibration.
    - distance from decision boundary (55) increases confidence
    - more evidence signals increases confidence
    - low sample sufficiency suppresses confidence
    """
    ai_score = clamp_score(ai_score)
    sufficiency = max(0.0, min(1.0, sufficiency))
    distance = abs(ai_score - 55.0)
    margin_strength = min(1.0, distance / 45.0)
    signal_strength = min(1.0, signal_count / 5.0)
    evidence_strength = (0.6 * sufficiency) + (0.4 * signal_strength)

    # Keep confidence conservative unless both margin and evidence are strong.
    confidence = 0.50 + (0.43 * margin_strength * evidence_strength)
    return round(max(0.50, min(0.93, confidence)), 3)


def prepend_low_evidence(explanation: str, sufficiency: float, signal_count: int) -> str:
    if sufficiency >= 0.45 and signal_count >= 2:
        return explanation
    return (
        "Low-evidence sample: result may be uncertain. "
        + explanation
    )


def build_justification(
    modality: str,
    classification: str,
    confidence: float,
    signals: list[str],
    sufficiency: float,
    max_signals: int = 3,
) -> str:
    primary = " | ".join(signals[:max_signals]) if signals else f"No strong {modality} anomalies were detected."
    confidence_pct = int(round(confidence * 100))
    base = f"{modality.title()} assessment: {classification} ({confidence_pct}% confidence). {primary}"
    return prepend_low_evidence(base, sufficiency, len(signals))
