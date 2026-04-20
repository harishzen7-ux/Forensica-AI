import os
import shutil
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.upload import FileUpload
from app.models.analysis import AnalysisResult
from app.schemas.analysis import AnalysisResult as AnalysisResultSchema
from app.workers.tasks import process_analysis
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=AnalysisResultSchema)
def upload_file(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_or_guest),
    file: UploadFile = File(None),
    text_content: str = Form(None),
    background_tasks: BackgroundTasks
):
    if not file and not text_content:
        raise HTTPException(status_code=400, detail="Must provide either file or text_content")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    file_path = ""
    content_type = ""
    filename = ""

    if file:
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        content_type = file.content_type
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    elif text_content:
        filename = f"{uuid.uuid4()}_text.txt"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        content_type = "raw_text"
        with open(file_path, "w") as f:
            f.write(text_content)

    # Save to db
    upload_record = FileUpload(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path,
        content_type=content_type
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    # Create pending analysis
    analysis_record = AnalysisResult(
        upload_id=upload_record.id,
        status="pending"
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    # Dispatch Background Task
    background_tasks.add_task(process_analysis, analysis_record.id)

    return analysis_record
