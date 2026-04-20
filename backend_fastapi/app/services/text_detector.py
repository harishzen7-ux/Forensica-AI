from app.services.detection_adapter import format_ml_detection_result
from app.services.ml_inference import analyze_text_real


def analyze_text(file_path: str = None, text_content: str = None) -> dict:
    text = (text_content or "").strip()

    if not text and file_path:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
                text = file.read().strip()
        except Exception:
            return {
                "classification": "Unknown",
                "confidence": 0.0,
                "explanation": "Could not read file content.",
            }

    if not text:
        return {
            "classification": "Unknown",
            "confidence": 0.0,
            "explanation": "No text content was provided for analysis.",
        }

    return format_ml_detection_result("text", analyze_text_real(text))
