import base64
import json
import urllib.error
import urllib.request
from typing import Optional

from app.core.config import settings


def _score_to_confidence(score: int) -> float:
    margin = abs(score - 55)
    confidence = 0.52 + (margin / 55.0) * 0.43
    return round(max(0.50, min(0.95, confidence)), 4)


def _from_authenticity_score(score: int, summary: str) -> dict:
    classification = "AI-Generated" if score < 55 else "Real"
    return {
        "classification": classification,
        "confidence": _score_to_confidence(score),
        "explanation": summary,
    }


def analyze_with_model_service(
    modality: str,
    *,
    file_path: Optional[str] = None,
    mime_type: Optional[str] = None,
    text_content: Optional[str] = None,
) -> Optional[dict]:
    if not settings.MODEL_SERVICE_URL:
        return None

    payload: dict = {
        "modality": modality,
        "mimeType": mime_type,
        "requestedModels": [],
        "exactNameLayer": True,
        "allowHiveAdapter": True,
    }

    if modality == "text":
        text = text_content or ""
        if not text and file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except UnicodeDecodeError:
                with open(file_path, "r", encoding="latin-1", errors="ignore") as f:
                    text = f.read()
        payload["text"] = text
    else:
        if not file_path:
            return None
        with open(file_path, "rb") as f:
            content = f.read()
        payload["contentBase64"] = base64.b64encode(content).decode("ascii")

    try:
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{settings.MODEL_SERVICE_URL.rstrip('/')}/analyze",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        timeout_seconds = max(1, int(settings.MODEL_SERVICE_TIMEOUT_MS / 1000))
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

    score = result.get("authenticity_score")
    summary = result.get("forensic_summary", "Model-service analysis completed.")
    if not isinstance(score, int):
        return None
    return _from_authenticity_score(score, summary)
