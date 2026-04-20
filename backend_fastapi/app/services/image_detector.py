from app.services.detection_adapter import format_ml_detection_result
from app.services.ml_inference import analyze_image_real


def analyze_image(file_path: str, mime_type: str = None) -> dict:
    try:
        with open(file_path, "rb") as file:
            image_bytes = file.read()
    except Exception:
        return {
            "classification": "Unknown",
            "confidence": 0.0,
            "explanation": "Could not read image file.",
        }

    return format_ml_detection_result("image", analyze_image_real(image_bytes))
