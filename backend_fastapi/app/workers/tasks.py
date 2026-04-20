from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.analysis import AnalysisResult
from app.models.upload import FileUpload
from app.services.image_detector import analyze_image
from app.services.video_detector import analyze_video
from app.services.audio_detector import analyze_audio
from app.services.text_detector import analyze_text

def process_analysis(analysis_id: int):
    db: Session = SessionLocal()
    try:
        # Get AnalysisResult
        analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
        if not analysis:
            print(f"Task processing failed: AnalysisResult {analysis_id} not found.")
            return

        # Update status to processing
        analysis.status = "processing"
        db.commit()

        # Get Uploaded File
        upload = db.query(FileUpload).filter(FileUpload.id == analysis.upload_id).first()
        if not upload:
            analysis.status = "failed"
            analysis.explanation = "Uploaded file record not found."
            db.commit()
            return

        # Determine type and analyze
        content_type = upload.content_type or ""
        file_path = upload.file_path
        
        result = {}
        if content_type.startswith("image/"):
            result = analyze_image(file_path=file_path, mime_type=content_type)
        elif content_type.startswith("video/"):
            result = analyze_video(file_path=file_path, mime_type=content_type)
        elif content_type.startswith("audio/"):
            result = analyze_audio(file_path=file_path, mime_type=content_type)
        elif content_type.startswith("text/") or content_type == "raw_text":
            result = analyze_text(file_path=file_path)
        else:
            analysis.status = "failed"
            analysis.explanation = f"Unsupported content type: {content_type}"
            db.commit()
            return
        
        # Save results
        analysis.classification = result.get("classification")
        analysis.confidence = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.status = "completed"
        analysis.completed_at = datetime.utcnow()
        db.commit()

        print(f"Analysis {analysis_id} completed successfully.")

    except Exception as exc:
        print(f"Error processing analysis {analysis_id}: {exc}")
        analysis.status = "failed"
        analysis.explanation = "RATE_LIMIT_EXCEEDED" if "RATE_LIMIT_EXCEEDED" in str(exc) else f"Internal server error: {str(exc)}"
        db.commit()
    finally:
        db.close()
