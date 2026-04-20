from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class FileUploadBase(BaseModel):
    filename: str
    content_type: str

class FileUploadCreate(FileUploadBase):
    file_path: str
    user_id: int

class FileUpload(FileUploadBase):
    id: int
    user_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
