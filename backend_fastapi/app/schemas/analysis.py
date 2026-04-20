from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AnalysisResultBase(BaseModel):
    status: str

class AnalysisResultCreate(AnalysisResultBase):
    upload_id: int

class AnalysisResultUpdate(AnalysisResultBase):
    classification: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    completed_at: Optional[datetime] = None

class AnalysisResult(AnalysisResultBase):
    id: int
    upload_id: int
    classification: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
