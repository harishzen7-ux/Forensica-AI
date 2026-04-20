from app.services.detection_adapter import format_ml_detection_result
from app.services.ml_inference import analyze_video_real


def analyze_video(file_path: str, mime_type: str = None) -> dict:
    try:
        with open(file_path, "rb") as file:
            video_bytes = file.read()
    except Exception:
        return {
            "classification": "Unknown",
            "confidence": 0.0,
            "explanation": "Could not read video file.",
        }

    return format_ml_detection_result("video", analyze_video_real(video_bytes))
