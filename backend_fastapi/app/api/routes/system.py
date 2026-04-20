from typing import Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.analysis import AnalysisResult
from app.models.upload import FileUpload

router = APIRouter()

class SystemStats(BaseModel):
    totalAttempts: int
    averageAccuracy: float
    learningProgress: int
    intelligenceStatus: str
    neuralVersion: str

class HistoryItem(BaseModel):
    id: int
    modality: str
    source: str
    score: float
    confidence: float
    justification: str
    timestamp: str

class FeedbackRequest(BaseModel):
    analysisId: int
    rating: int
    isCorrect: bool

@router.get("/stats", response_model=SystemStats)
def get_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest)
) -> Any:
    user_results = (
        db.query(AnalysisResult)
        .join(FileUpload)
        .filter(FileUpload.user_id == current_user.id)
        .all()
    )
    total_attempts = len(user_results)
    completed_with_confidence = [r.confidence for r in user_results if r.confidence is not None]
    average_accuracy = round((sum(completed_with_confidence) / len(completed_with_confidence)) * 100, 2) if completed_with_confidence else 0.0
    learning_progress = min(100, max(1, total_attempts * 5)) if total_attempts else 1

    if learning_progress <= 25:
        intelligence_status = "Novice"
    elif learning_progress <= 50:
        intelligence_status = "Advanced"
    elif learning_progress <= 75:
        intelligence_status = "Expert"
    elif learning_progress <= 90:
        intelligence_status = "Master"
    else:
        intelligence_status = "Quantum"

    return {
        "totalAttempts": total_attempts,
        "averageAccuracy": average_accuracy,
        "learningProgress": learning_progress,
        "intelligenceStatus": intelligence_status,
        "neuralVersion": "Neural engine v4"
    }

@router.get("/history", response_model=List[HistoryItem])
def get_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest)
) -> Any:
    rows = (
        db.query(AnalysisResult, FileUpload)
        .join(FileUpload, FileUpload.id == AnalysisResult.upload_id)
        .filter(FileUpload.user_id == current_user.id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(25)
        .all()
    )
    
    history_items = []
    for analysis, upload in rows:
        content_type = (upload.content_type or "").lower()
        if content_type.startswith("image/"):
            modality = "photo"
        elif content_type.startswith("video/"):
            modality = "video"
        elif content_type.startswith("audio/"):
            modality = "audio"
        else:
            modality = "text"

        source = "AI" if "ai" in (analysis.classification or "").lower() else "HUMAN"
        confidence = analysis.confidence or 0.0
        score = round(confidence * 100, 2) if source == "HUMAN" else round((1 - confidence) * 100, 2)

        history_items.append({
            "id": analysis.id,
            "modality": modality,
            "source": source,
            "score": max(0.0, min(100.0, score)),
            "confidence": confidence,
            "justification": analysis.explanation or "Processing completed.",
            "timestamp": analysis.created_at.isoformat() if analysis.created_at else ""
        })
    return history_items

@router.post("/history/clear")
def clear_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest)
) -> Any:
    # Get upload IDs for current user
    user_upload_ids = db.query(FileUpload.id).filter(FileUpload.user_id == current_user.id).subquery()
    # Delete analysis results for those uploads
    db.query(AnalysisResult).filter(AnalysisResult.upload_id.in_(user_upload_ids)).delete(synchronize_session='fetch')
    db.commit()
    return {"message": "History cleared"}

@router.post("/feedback")
def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest)
) -> Any:
    # Mock storing feedback
    return {"message": "Feedback received"}
