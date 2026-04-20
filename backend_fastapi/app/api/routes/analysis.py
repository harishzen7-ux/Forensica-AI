from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.analysis import AnalysisResult
from app.models.upload import FileUpload
from app.schemas.analysis import AnalysisResult as AnalysisResultSchema

router = APIRouter()

@router.get("/{analysis_id}", response_model=AnalysisResultSchema)
def get_analysis_result(
    analysis_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest)
) -> Any:
    # First get the analysis result
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # Check if the current user owns the upload associated with this analysis
    upload = db.query(FileUpload).filter(FileUpload.id == analysis.upload_id).first()
    if not upload or upload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return analysis
