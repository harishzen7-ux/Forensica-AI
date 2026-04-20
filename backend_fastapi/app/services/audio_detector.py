from app.services.detection_adapter import format_ml_detection_result
from app.services.ml_inference import analyze_audio_real


def analyze_audio(file_path: str, mime_type: str = None) -> dict:
    try:
        with open(file_path, "rb") as file:
            audio_bytes = file.read()
    except Exception:
        return {
            "classification": "Unknown",
            "confidence": 0.0,
            "explanation": "Could not read audio file.",
        }

    return format_ml_detection_result("audio", analyze_audio_real(audio_bytes))
